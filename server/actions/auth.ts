import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { AuthCode } from '../database/models/AuthCode'
import { User } from '../database/models/User'
import { hashValue, verifyHash } from '../lib/hash'
import { sendVerificationCodeEmail } from '../lib/mailer'
import { isRateLimited, recordAttempt } from '../lib/rate-limit'
import { verifyTurnstileToken } from '../lib/turnstile'

const CODE_TTL_MINUTES = 10

/*
 * Always resolves to the same generic body regardless of why a code wasn't
 * actually sent (bad Turnstile token, unknown email, malformed input, rate
 * limited) — an attacker probing this endpoint can't learn which emails have
 * accounts.
 */
const GENERIC_REQUEST_RESPONSE = {
	message: 'If an account exists for that email, a verification code has been sent.'
}

/*
 * Same principle for verification: expired, wrong, already-used, unknown-email
 * and rate-limited all look identical to the caller.
 */
const GENERIC_VERIFY_FAILURE = {
	error: { code: 'INVALID_CODE', message: 'Invalid or expired code.' }
}

function generateCode(): string {
	return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export const requestCode = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const { email, turnstileToken } = request.body as { email?: string; turnstileToken?: string }

		if (!email || !turnstileToken) {
			response.status(400).json({
				error: { code: 'MISSING_FIELDS', message: 'email and turnstileToken are required' }
			})
			return
		}

		const ip = request.ip ?? 'unknown'

		if (await isRateLimited('request-code', email, ip)) {
			response.json(GENERIC_REQUEST_RESPONSE)
			return
		}

		await recordAttempt('request-code', email, ip)

		const turnstileValid = await verifyTurnstileToken(turnstileToken, request.ip)

		if (!turnstileValid) {
			response.json(GENERIC_REQUEST_RESPONSE)
			return
		}

		const user = await User.findOne({ email })

		if (user) {
			const code = generateCode()
			const codeHash = await hashValue(code)

			await AuthCode.create({
				email,
				codeHash,
				expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)
			})

			// Delivery failure isn't surfaced to the caller — the response stays
			// generic either way so an attacker can't distinguish "no account" from
			// "account exists but the email provider is down" - but it is logged
			// server-side (without the email address) so a delivery outage is visible in ops.
			const delivered = await sendVerificationCodeEmail(email, code, CODE_TTL_MINUTES)

			if (!delivered) {
				console.error('Verification code email was not delivered')
			}
		}

		response.json(GENERIC_REQUEST_RESPONSE)
	} catch (error) {
		next(error)
	}
}

export const verifyCode = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const { email, code } = request.body as { email?: string; code?: string }

		if (!email || !code) {
			response.status(400).json({
				error: { code: 'MISSING_FIELDS', message: 'email and code are required' }
			})
			return
		}

		const ip = request.ip ?? 'unknown'

		// Same 5/15min-per-email budget as request-code, own scope so the two
		// don't share a bucket — recorded unconditionally below so repeated
		// wrong guesses (not just eventual successes) count against it.
		if (await isRateLimited('verify-code', email, ip)) {
			response.status(401).json(GENERIC_VERIFY_FAILURE)
			return
		}

		await recordAttempt('verify-code', email, ip)

		// Bounded by the request-code limiter (at most 5 active codes per
		// email), so checking each candidate's hash here is cheap.
		const candidates = await AuthCode.find({
			email,
			used: false,
			expiresAt: { $gt: new Date() }
		})

		let matchedCandidateId: string | null = null

		for (const candidate of candidates) {
			if (await verifyHash(code, candidate.codeHash)) {
				matchedCandidateId = candidate.id
				break
			}
		}

		if (!matchedCandidateId) {
			response.status(401).json(GENERIC_VERIFY_FAILURE)
			return
		}

		// Atomic claim: the match above only proves the candidate *was* unused
		// at read time. Two concurrent requests can both match the same
		// candidate before either writes `used: true`, so the actual single-use
		// guarantee has to be this conditional update, not the find above.
		// Only the request that flips `used: false -> true` gets a document
		// back; a second, concurrent request loses the race and matchedCode
		// comes back null.
		const matchedCode = await AuthCode.findOneAndUpdate(
			{ _id: matchedCandidateId, used: false },
			{ used: true }
		)

		if (!matchedCode) {
			response.status(401).json(GENERIC_VERIFY_FAILURE)
			return
		}

		const user = await User.findOne({ email })

		if (!user) {
			response.status(401).json(GENERIC_VERIFY_FAILURE)
			return
		}

		response.status(200).json({ valid: true, userId: user.id, username: user.username })
	} catch (error) {
		next(error)
	}
}
