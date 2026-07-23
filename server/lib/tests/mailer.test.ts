import { sendVerificationCodeEmail } from '../mailer'

const EMAIL = 'critic7@example.com'
const CODE = '123456'

afterEach(() => {
	jest.restoreAllMocks()
	delete process.env.RESEND_API_KEY
	delete process.env.MAIL_FROM_ADDRESS
})

describe('sendVerificationCodeEmail', () => {
	test('not configured (missing API key or from address) returns false without any network call', async() => {
		const fetchSpy = jest.spyOn(global, 'fetch')

		const delivered = await sendVerificationCodeEmail(EMAIL, CODE, 10)

		expect(delivered).toBe(false)
		expect(fetchSpy).not.toHaveBeenCalled()
	})

	test('configured and Resend accepts: returns true and posts the code in the body', async() => {
		process.env.RESEND_API_KEY = 'super-secret-key'
		process.env.MAIL_FROM_ADDRESS = 'CriticSeven <noreply@criticseven.example>'
		const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response)

		const delivered = await sendVerificationCodeEmail(EMAIL, CODE, 10)

		expect(delivered).toBe(true)
		expect(fetchSpy).toHaveBeenCalledTimes(1)

		const [url, init] = fetchSpy.mock.calls[0]

		expect(url).toBe('https://api.resend.com/emails')
		expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer super-secret-key')
		expect(JSON.parse(init?.body as string)).toMatchObject({ to: EMAIL, from: process.env.MAIL_FROM_ADDRESS })
		expect(JSON.parse(init?.body as string).text).toContain(CODE)
	})

	test('Resend returns a non-ok response: returns false, not a throw', async() => {
		process.env.RESEND_API_KEY = 'super-secret-key'
		process.env.MAIL_FROM_ADDRESS = 'CriticSeven <noreply@criticseven.example>'
		jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response)

		await expect(sendVerificationCodeEmail(EMAIL, CODE, 10)).resolves.toBe(false)
	})

	test('network error: returns false, not a throw', async() => {
		process.env.RESEND_API_KEY = 'super-secret-key'
		process.env.MAIL_FROM_ADDRESS = 'CriticSeven <noreply@criticseven.example>'
		jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network unreachable'))

		await expect(sendVerificationCodeEmail(EMAIL, CODE, 10)).resolves.toBe(false)
	})

	test('a failed send never logs the API key', async() => {
		process.env.RESEND_API_KEY = 'super-secret-key'
		process.env.MAIL_FROM_ADDRESS = 'CriticSeven <noreply@criticseven.example>'
		jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network unreachable'))
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

		await sendVerificationCodeEmail(EMAIL, CODE, 10)

		for (const call of consoleErrorSpy.mock.calls) {
			for (const argument of call) {
				expect(String(argument)).not.toContain('super-secret-key')
			}
		}
	})
})
