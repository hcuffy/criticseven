import { createCookieSessionStorage } from 'react-router'

/*
 * `createCookieSessionStorage` lives in the core `react-router` package, not
 * `@react-router/node` — the Remix/React Router merge moved the (framework-
 * agnostic, Web Crypto based) session utilities up to `react-router` itself.
 * `@react-router/node` now only carries Node-platform-specific pieces
 * (createFileSessionStorage, the Node http request-listener adapter), so
 * there's nothing to import from there for a cookie session.
 */

export interface SessionData {
	userId: string
	username: string
}

// Fail closed like the Turnstile check (server/lib/turnstile.ts): a missing
// secret in production must crash the process, not silently sign session
// cookies with a value that sits in source control — that would let anyone
// who has read the repo forge a valid session for any userId/username.
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
	throw new Error('SESSION_SECRET must be set in production')
}

const sessionSecret = process.env.SESSION_SECRET || 'dev-insecure-secret-change-me'

export const sessionStorage = createCookieSessionStorage<SessionData>({
	cookie: {
		name: '__session',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		secrets: [sessionSecret],
		path: '/'
	}
})

export async function getSession(request: Request) {
	return sessionStorage.getSession(request.headers.get('Cookie'))
}

// Call at the top of a loader/action and use the returned identity, or let
// the thrown 401 propagate to the route's error boundary.
export async function requireSession(request: Request): Promise<SessionData> {
	const session = await getSession(request)
	const userId = session.get('userId')
	const username = session.get('username')

	if (!userId || !username) {
		throw new Response('Unauthorized', { status: 401 })
	}

	return { userId, username }
}
