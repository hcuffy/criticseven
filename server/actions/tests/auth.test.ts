import express from 'express'
import request from 'supertest'
import { AuthCode } from '../../database/models/AuthCode'
import { User } from '../../database/models/User'
import { hashValue } from '../../lib/hash'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../test-support/database'
import authRoutes from '../../routes/auth-routes'

const app = express()

app.use(express.json())
app.use('/auth', authRoutes())

const EMAIL = 'critic7@example.com'
const CODE = '123456'

const GENERIC_FAILURE = {
	error: { code: 'INVALID_CODE', message: 'Invalid or expired code.' }
}

async function seedUser() {
	await User.create({ username: 'critic7', email: EMAIL, honestyScore: 50 })
}

async function seedCode(overrides: Partial<{ used: boolean; expiresAt: Date }> = {}) {
	const codeHash = await hashValue(CODE)

	return AuthCode.create({
		email: EMAIL,
		codeHash,
		used: overrides.used ?? false,
		expiresAt: overrides.expiresAt ?? new Date(Date.now() + 10 * 60 * 1000)
	})
}

beforeAll(async() => {
	await connectTestDatabase()
})

afterAll(async() => {
	await disconnectTestDatabase()
})

afterEach(async() => {
	await clearTestDatabase()
})

describe('POST /auth/verify-code', () => {
	test('valid code succeeds and returns the user identity', async() => {
		await seedUser()
		await seedCode()

		const response = await request(app).post('/auth/verify-code').send({ email: EMAIL, code: CODE })

		expect(response.status).toBe(200)
		expect(response.body).toEqual({ valid: true, userId: expect.any(String), username: 'critic7' })
	})

	test('single-use: a second attempt with the same code fails', async() => {
		await seedUser()
		await seedCode()

		const first = await request(app).post('/auth/verify-code').send({ email: EMAIL, code: CODE })
		const second = await request(app).post('/auth/verify-code').send({ email: EMAIL, code: CODE })

		expect(first.status).toBe(200)
		expect(second.status).toBe(401)
		expect(second.body).toEqual(GENERIC_FAILURE)
	})

	test('expiry: an expired code is rejected', async() => {
		await seedUser()
		await seedCode({ expiresAt: new Date(Date.now() - 1000) })

		const response = await request(app).post('/auth/verify-code').send({ email: EMAIL, code: CODE })

		expect(response.status).toBe(401)
		expect(response.body).toEqual(GENERIC_FAILURE)
	})

	test('an already-used code is rejected even before expiry', async() => {
		await seedUser()
		await seedCode({ used: true })

		const response = await request(app).post('/auth/verify-code').send({ email: EMAIL, code: CODE })

		expect(response.status).toBe(401)
		expect(response.body).toEqual(GENERIC_FAILURE)
	})

	test('wrong code, unknown email, and expired code all return the identical response', async() => {
		await seedUser()
		await seedCode()

		const wrongCode = await request(app).post('/auth/verify-code').send({ email: EMAIL, code: '000000' })
		const unknownEmail = await request(app)
			.post('/auth/verify-code')
			.send({ email: 'nobody@example.com', code: CODE })

		expect(wrongCode.status).toBe(unknownEmail.status)
		expect(wrongCode.body).toEqual(unknownEmail.body)
		expect(wrongCode.body).toEqual(GENERIC_FAILURE)
	})

	test('rate limit: a 6th attempt within 15 minutes is rejected even with the correct code', async() => {
		await seedUser()
		await seedCode()

		for (let i = 0; i < 5; i += 1) {
			const attempt = await request(app).post('/auth/verify-code').send({ email: EMAIL, code: '000000' })

			expect(attempt.status).toBe(401)
		}

		const sixthAttempt = await request(app).post('/auth/verify-code').send({ email: EMAIL, code: CODE })

		expect(sixthAttempt.status).toBe(401)
		expect(sixthAttempt.body).toEqual(GENERIC_FAILURE)
	})

	test('race condition: two concurrent requests with the same valid code, only one succeeds', async() => {
		await seedUser()
		await seedCode()

		const [first, second] = await Promise.all([
			request(app).post('/auth/verify-code').send({ email: EMAIL, code: CODE }),
			request(app).post('/auth/verify-code').send({ email: EMAIL, code: CODE })
		])

		const statuses = [first.status, second.status].sort()

		expect(statuses).toEqual([200, 401])
	})

	test('missing fields return a distinct 400, not the generic-failure body', async() => {
		const response = await request(app).post('/auth/verify-code').send({ email: EMAIL })

		expect(response.status).toBe(400)
		expect(response.body).not.toEqual(GENERIC_FAILURE)
	})
})
