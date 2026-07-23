const RESEND_API_URL = 'https://api.resend.com/emails'

/*
 * Thin wrapper around Resend's HTTP API, not the SDK — matches the
 * fetch-based style already used for Turnstile/Cloudflare Images, and avoids
 * an extra dependency for a single call site. Fails closed: a missing
 * configuration or a non-ok/network failure returns false rather than
 * throwing, so the caller can keep responding with the generic
 * account-existence-hiding message regardless of delivery outcome.
 */
export async function sendVerificationCodeEmail(email: string, code: string, expiresInMinutes: number): Promise<boolean> {
	const apiKey = process.env.RESEND_API_KEY
	const fromAddress = process.env.MAIL_FROM_ADDRESS

	if (!apiKey || !fromAddress) {
		return false
	}

	try {
		const response = await fetch(RESEND_API_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: fromAddress,
				to: email,
				subject: 'Your CriticSeven verification code',
				text: `Your verification code is ${code}. It expires in ${expiresInMinutes} minutes.`
			})
		})

		return response.ok
	} catch (error) {
		console.error('Verification code email send failed:', (error as Error).message)
		return false
	}
}
