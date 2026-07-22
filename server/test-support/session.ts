import { createHmac } from 'crypto'
import { DEV_SESSION_SECRET } from '../session'

// Encode-side counterpart to server/session.ts's verifier — builds a cookie
// value in the exact format createCookieSessionStorage produces (verified
// against a real one in server/actions/tests/opinions.test.ts), so route
// tests can exercise the real Express-side session check instead of
// bypassing it.
export function createSignedSessionCookieValue(data: Record<string, unknown>): string {
	const value = Buffer.from(JSON.stringify(data), 'utf8').toString('base64')
	const hash = createHmac('sha256', DEV_SESSION_SECRET).update(value).digest('base64').replace(/=+$/, '')

	return `${value}.${hash}`
}
