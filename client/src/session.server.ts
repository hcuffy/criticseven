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

// Reusable gate for future routes (Phase 5: opinion/review/vote creation) —
// call at the top of a loader/action and use the returned identity, or let
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
