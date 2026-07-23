import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { User, UserDocument } from '../../database/models/User'
import { TrailerOpinion } from '../../database/models/trailer-opinion'
import movieRoutes from '../../routes/movie-routes'
import opinionRoutes from '../../routes/opinion-routes'
import { SESSION_COOKIE_NAME } from '../../session'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../test-support/database'
import { createSignedSessionCookieValue } from '../../test-support/session'

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use('/opinions', opinionRoutes())
app.use('/movies', movieRoutes())

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
	await TrailerOpinion.init()
})

afterAll(async() => {
	await disconnectTestDatabase()
})

afterEach(async() => {
	await clearTestDatabase()
})

describe('POST /opinions', () => {
	test('rejects a request with no session cookie', async() => {
		const response = await request(app).post('/opinions').send({ movieId: 550, hypeLevel: 4, comment: 'Hyped.' })

		expect(response.status).toBe(401)
		expect(response.body).toEqual({
			error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
		})
	})

	test('rejects a tampered session cookie', async() => {
		const user = await seedUser()
		const tamperedCookie = `${sessionCookieFor(user)}tampered`

		const response = await request(app)
			.post('/opinions')
			.set('Cookie', tamperedCookie)
			.send({ movieId: 550, hypeLevel: 4, comment: 'Hyped.' })

		expect(response.status).toBe(401)
	})

	test('ignores a body-supplied userId — cannot post as someone else by curling directly', async() => {
		const authenticatedUser = await seedUser({ username: 'critic7', email: 'critic7@example.com' })
		const impersonationTarget = await seedUser({ username: 'critic8', email: 'critic8@example.com' })

		const response = await request(app)
			.post('/opinions')
			.set('Cookie', sessionCookieFor(authenticatedUser))
			.send({ userId: impersonationTarget.id, movieId: 550, hypeLevel: 4, comment: 'Hyped.' })

		expect(response.status).toBe(201)
		expect(response.body.author.username).toBe('critic7')
	})

	test('rejects hypeLevel outside 1-5', async() => {
		const user = await seedUser()

		const response = await request(app)
			.post('/opinions')
			.set('Cookie', sessionCookieFor(user))
			.send({ movieId: 550, hypeLevel: 6, comment: '' })

		expect(response.status).toBe(400)
	})

	test('creates an opinion and returns the public DTO with the author embedded', async() => {
		const user = await seedUser()

		const response = await request(app)
			.post('/opinions')
			.set('Cookie', sessionCookieFor(user))
			.send({ movieId: 550, hypeLevel: 4, comment: 'Hyped.' })

		expect(response.status).toBe(201)
		expect(Object.keys(response.body).sort()).toEqual(['author', 'comment', 'createdAt', 'hypeLevel', 'id', 'movieId', 'netVoteCount', 'viewerVote'].sort())
		expect(response.body).not.toHaveProperty('userId')
		expect(response.body.author).toEqual({
			username: 'critic7', honestyScore: 50, isLowTrust: false, isPhoneVerified: false, createdAt: user.createdAt.toISOString()
		})
	})

	test('a second opinion by the same user on the same movie is rejected as a conflict', async() => {
		const user = await seedUser()
		const cookie = sessionCookieFor(user)

		await request(app).post('/opinions').set('Cookie', cookie).send({ movieId: 550, hypeLevel: 4, comment: '' })

		const response = await request(app)
			.post('/opinions')
			.set('Cookie', cookie)
			.send({ movieId: 550, hypeLevel: 2, comment: 'Changed my mind.' })

		expect(response.status).toBe(409)
	})
})

describe('GET /movies/:movieId/opinions', () => {
	test('is public and returns paginated public DTOs, author never exposes email', async() => {
		const first = await seedUser({ username: 'critic7', email: 'critic7@example.com' })
		const second = await seedUser({ username: 'critic8', email: 'critic8@example.com' })

		await TrailerOpinion.create({ userId: first.id, movieId: 550, hypeLevel: 4, comment: '' })
		await TrailerOpinion.create({ userId: second.id, movieId: 550, hypeLevel: 2, comment: '' })
		await TrailerOpinion.create({ userId: first.id, movieId: 551, hypeLevel: 5, comment: '' })

		const response = await request(app).get('/movies/550/opinions')

		expect(response.status).toBe(200)
		expect(response.body.totalResults).toBe(2)
		expect(response.body.results).toHaveLength(2)

		for (const opinion of response.body.results) {
			expect(Object.keys(opinion).sort()).toEqual(['author', 'comment', 'createdAt', 'hypeLevel', 'id', 'movieId', 'netVoteCount', 'viewerVote'].sort())
			expect(JSON.stringify(opinion)).not.toContain('@example.com')
		}
	})

	test('rejects a non-integer movieId', async() => {
		const response = await request(app).get('/movies/not-a-number/opinions')

		expect(response.status).toBe(400)
	})
})
