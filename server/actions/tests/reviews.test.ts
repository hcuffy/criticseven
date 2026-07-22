import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { User, UserDocument } from '../../database/models/User'
import { Review } from '../../database/models/review'
import movieRoutes from '../../routes/movie-routes'
import reviewRoutes from '../../routes/review-routes'
import { SESSION_COOKIE_NAME } from '../../session'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../test-support/database'
import { createSignedSessionCookieValue } from '../../test-support/session'

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use('/reviews', reviewRoutes())
app.use('/movies', movieRoutes())

const CRITERIA_SCORES = {
	plot: 8, acting: 7, writing: 9, score: 8, directing: 6, editing: 7, cinematography: 9
}

async function seedUser(overrides: Partial<{ username: string; email: string; honestyScore: number }> = {}) {
	return User.create({
		username: overrides.username ?? 'critic7',
		email: overrides.email ?? 'critic7@example.com',
		honestyScore: overrides.honestyScore ?? 50
	})
}

function sessionCookieFor(user: UserDocument) {
	const value = createSignedSessionCookieValue({ userId: user.id, username: user.username })

	return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

beforeAll(async() => {
	await connectTestDatabase()
	await Review.init()
})

afterAll(async() => {
	await disconnectTestDatabase()
})

afterEach(async() => {
	await clearTestDatabase()
})

describe('POST /reviews', () => {
	test('rejects a request with no session cookie', async() => {
		const response = await request(app)
			.post('/reviews')
			.send({ movieId: 550, comment: 'Loved it.', ...CRITERIA_SCORES })

		expect(response.status).toBe(401)
		expect(response.body).toEqual({
			error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
		})
	})

	test('rejects a tampered session cookie', async() => {
		const user = await seedUser()
		const tamperedCookie = `${sessionCookieFor(user)}tampered`

		const response = await request(app)
			.post('/reviews')
			.set('Cookie', tamperedCookie)
			.send({ movieId: 550, comment: '', ...CRITERIA_SCORES })

		expect(response.status).toBe(401)
	})

	test('ignores a body-supplied userId — cannot post as someone else by curling directly', async() => {
		const authenticatedUser = await seedUser({ username: 'critic7', email: 'critic7@example.com' })
		const impersonationTarget = await seedUser({ username: 'critic8', email: 'critic8@example.com' })

		const response = await request(app)
			.post('/reviews')
			.set('Cookie', sessionCookieFor(authenticatedUser))
			.send({ userId: impersonationTarget.id, movieId: 550, comment: '', ...CRITERIA_SCORES })

		expect(response.status).toBe(201)
		expect(response.body.author.username).toBe('critic7')
	})

	test('rejects a missing criterion', async() => {
		const user = await seedUser()
		const body: Record<string, unknown> = { movieId: 550, comment: '', ...CRITERIA_SCORES }

		delete body.plot

		const response = await request(app).post('/reviews').set('Cookie', sessionCookieFor(user)).send(body)

		expect(response.status).toBe(400)
	})

	test('rejects a criterion outside 1-10', async() => {
		const user = await seedUser()

		const response = await request(app)
			.post('/reviews')
			.set('Cookie', sessionCookieFor(user))
			.send({ movieId: 550, comment: '', ...CRITERIA_SCORES, plot: 11 })

		expect(response.status).toBe(400)
	})

	test('creates a review and returns the public DTO with the author embedded', async() => {
		const user = await seedUser()

		const response = await request(app)
			.post('/reviews')
			.set('Cookie', sessionCookieFor(user))
			.send({ movieId: 550, comment: 'Loved it.', ...CRITERIA_SCORES })

		expect(response.status).toBe(201)
		expect(Object.keys(response.body).sort()).toEqual(
			[
				'acting', 'author', 'cinematography', 'comment', 'createdAt', 'directing', 'editing', 'id', 'movieId',
				'plot', 'score', 'writing'
			].sort()
		)
		expect(response.body).not.toHaveProperty('userId')
		expect(response.body.author).toEqual({
			username: 'critic7', honestyScore: 50, isLowTrust: false, isPhoneVerified: false
		})
	})

	test('a second review by the same user on the same movie is rejected as a conflict', async() => {
		const user = await seedUser()
		const cookie = sessionCookieFor(user)

		await request(app).post('/reviews').set('Cookie', cookie).send({ movieId: 550, comment: '', ...CRITERIA_SCORES })

		const response = await request(app)
			.post('/reviews')
			.set('Cookie', cookie)
			.send({ movieId: 550, comment: 'On rewatch.', ...CRITERIA_SCORES })

		expect(response.status).toBe(409)
	})
})

describe('GET /movies/:movieId/reviews', () => {
	test('is public and returns paginated public DTOs, author never exposes email', async() => {
		const first = await seedUser({ username: 'critic7', email: 'critic7@example.com' })
		const second = await seedUser({ username: 'critic8', email: 'critic8@example.com' })

		await Review.create({ userId: first.id, movieId: 550, comment: '', ...CRITERIA_SCORES })
		await Review.create({ userId: second.id, movieId: 550, comment: '', ...CRITERIA_SCORES })
		await Review.create({ userId: first.id, movieId: 551, comment: '', ...CRITERIA_SCORES })

		const response = await request(app).get('/movies/550/reviews')

		expect(response.status).toBe(200)
		expect(response.body.totalResults).toBe(2)
		expect(response.body.results).toHaveLength(2)

		for (const review of response.body.results) {
			expect(JSON.stringify(review)).not.toContain('@example.com')
		}
	})

	test('rejects a non-integer movieId', async() => {
		const response = await request(app).get('/movies/not-a-number/reviews')

		expect(response.status).toBe(400)
	})
})
