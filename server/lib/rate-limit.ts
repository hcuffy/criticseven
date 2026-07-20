import { RateLimitEvent } from '../database/models/RateLimitEvent'

const EMAIL_LIMIT = 5
const EMAIL_WINDOW_MS = 15 * 60 * 1000
const IP_LIMIT = 20
const IP_WINDOW_MS = 60 * 60 * 1000

/*
 * Two independent windows: per-email catches repeated probing of one target,
 * per-IP catches one source rotating through many target emails. Either one
 * tripping is enough to reject — the caller must not distinguish which.
 * `scope` keeps request-code and verify-code budgets from starving each other.
 */
export async function isRateLimited(scope: string, email: string, ip: string): Promise<boolean> {
	const now = Date.now()

	const [emailCount, ipCount] = await Promise.all([
		RateLimitEvent.countDocuments({ scope, email, createdAt: { $gte: new Date(now - EMAIL_WINDOW_MS) } }),
		RateLimitEvent.countDocuments({ scope, ip, createdAt: { $gte: new Date(now - IP_WINDOW_MS) } })
	])

	return emailCount >= EMAIL_LIMIT || ipCount >= IP_LIMIT
}

// Recorded for every request that reaches this point (valid shape, past the
// rate-limit check itself) — regardless of whether the subsequent check
// (Turnstile, code match) succeeds, so probing attempts still count.
export async function recordAttempt(scope: string, email: string, ip: string): Promise<void> {
	await RateLimitEvent.create({ scope, email, ip })
}
