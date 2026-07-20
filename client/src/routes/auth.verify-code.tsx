import { sessionStorage } from '../session.server'
import type { Route } from './+types/auth.verify-code'

const API_URL = process.env.API_URL ?? 'http://localhost:5000'

const GENERIC_FAILURE = {
	error: { code: 'INVALID_CODE', message: 'Invalid or expired code.' }
}

interface VerifyCodeSuccess {
	valid: true
	userId: string
	username: string
}

export async function action({ request }: Route.ActionArgs) {
	const body = await request.json()

	const upstream = await fetch(`${API_URL}/auth/verify-code`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	})

	if (!upstream.ok) {
		return Response.json(GENERIC_FAILURE, { status: 401 })
	}

	const result = (await upstream.json()) as VerifyCodeSuccess

	const session = await sessionStorage.getSession()

	session.set('userId', result.userId)
	session.set('username', result.username)

	return Response.json(
		{ valid: true },
		{ headers: { 'Set-Cookie': await sessionStorage.commitSession(session) } }
	)
}
