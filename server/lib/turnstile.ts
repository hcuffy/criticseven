const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/*
 * Verifies a Cloudflare Turnstile token server-side before any code is
 * generated. Fails closed: network errors or a missing secret are treated as
 * verification failure, never as a bypass.
 */
export async function verifyTurnstileToken(token: string | undefined, remoteIp?: string): Promise<boolean> {
	const secret = process.env.TURNSTILE_SECRET_KEY

	if (!secret || !token) {
		return false
	}

	try {
		const body = new URLSearchParams({ secret, response: token })

		if (remoteIp) {
			body.set('remoteip', remoteIp)
		}

		const response = await fetch(SITEVERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body
		})

		if (!response.ok) {
			return false
		}

		const result = (await response.json()) as { success: boolean }

		return result.success === true
	} catch {
		return false
	}
}
