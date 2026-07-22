import { createHmac, timingSafeEqual } from 'crypto'

export const SESSION_COOKIE_NAME = '__session'

// Same insecure-but-explicit dev fallback as client/src/session.server.ts —
// both processes must resolve to the same secret for a session issued by
// the React Router layer to verify here.
export const DEV_SESSION_SECRET = 'dev-insecure-secret-change-me'

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
	throw new Error('SESSION_SECRET must be set in production')
}

const sessionSecret = process.env.SESSION_SECRET || DEV_SESSION_SECRET

/*
 * Express is reachable directly over the network (plain `http.Server`,
 * bound to all interfaces, no reverse proxy/firewall config anywhere in
 * this repo) — POST /opinions and POST /reviews cannot trust a
 * caller-supplied userId. The actual identity comes from the same signed
 * `__session` cookie the React Router layer already issues
 * (client/src/session.server.ts, createCookieSessionStorage).
 *
 * Rather than depend on the `react-router` package here — it's ESM-only
 * (ships `"type": "module"`) and this server is Babel-transpiled to
 * CommonJS; requiring it would couple Express's runtime to whatever Node
 * version happens to support `require(esm)`, and to the client
 * workspace's own react-router version — this re-verifies the exact same,
 * well-defined signing scheme
 * (react-router/lib/server-runtime/{cookies,crypto}.ts: HMAC-SHA256 over a
 * base64 JSON payload, `<base64Value>.<base64Signature>`) using only
 * Node's built-in `crypto`. Verified byte-for-byte against a real cookie
 * produced by `createCookieSessionStorage` before relying on it — see
 * server/actions/tests/opinions.test.ts.
 */
function verifySignedCookieValue(signedValue: string): unknown {
	const separatorIndex = signedValue.lastIndexOf('.')

	if (separatorIndex === -1) {
		return null
	}

	const value = signedValue.slice(0, separatorIndex)
	const providedHash = signedValue.slice(separatorIndex + 1)
	const expectedHash = createHmac('sha256', sessionSecret).update(value).digest('base64').replace(/=+$/, '')

	const providedBuffer = Buffer.from(providedHash)
	const expectedBuffer = Buffer.from(expectedHash)

	if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
		return null
	}

	try {
		return JSON.parse(Buffer.from(value, 'base64').toString('utf8'))
	} catch {
		return null
	}
}

// A missing or tampered cookie both resolve to null, never a thrown error —
// callers fail closed with a plain 401 (see server/actions/opinions.ts,
// server/actions/reviews.ts) rather than a 500 that could hint at why.
export function getAuthenticatedUserId(cookieHeaderValue: string | undefined): string | null {
	if (!cookieHeaderValue) {
		return null
	}

	const data = verifySignedCookieValue(cookieHeaderValue) as { userId?: unknown } | null

	return typeof data?.userId === 'string' ? data.userId : null
}
