import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { AuthCode } from '../database/models/AuthCode'
import { User } from '../database/models/User'
import { hashValue } from '../lib/hash'
import { isRateLimited, recordAttempt } from '../lib/rateLimit'
import { verifyTurnstileToken } from '../lib/turnstile'

const CODE_TTL_MINUTES = 10

/*
 * Always resolves to the same generic body regardless of why a code wasn't
 * actually sent (bad Turnstile token, unknown email, malformed input) — an
 * attacker probing this endpoint can't learn which emails have accounts.
 */
const GENERIC_RESPONSE = {
	message: 'If an account exists for that email, a verification code has been sent.'
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

		if (await isRateLimited(email, ip)) {
			response.json(GENERIC_RESPONSE)
			return
		}

		await recordAttempt(email, ip)

		const turnstileValid = await verifyTurnstileToken(turnstileToken, request.ip)

		if (!turnstileValid) {
			response.json(GENERIC_RESPONSE)
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

			// Delivery (email provider) is a separate, not-yet-made infra
			// decision — code is persisted and ready to send once that's wired up.
		}

		response.json(GENERIC_RESPONSE)
	} catch (error) {
		next(error)
	}
}
