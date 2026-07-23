import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { User, UserDocument } from '../../database/models/User'
import { Review } from '../../database/models/review'
import { TrailerOpinion } from '../../database/models/trailer-opinion'
import { Vote } from '../../database/models/vote'
import userRoutes from '../../routes/user-routes'
import { SESSION_COOKIE_NAME } from '../../session'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../test-support/database'
import { createSignedSessionCookieValue } from '../../test-support/session'

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use('/users', userRoutes())

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
	await TrailerOpinion.init()
	await Vote.init()
})

afterAll(async() => {
	await disconnectTestDatabase()
})

afterEach(async() => {
	await clearTestDatabase()
})

describe('GET /users/:username', () => {
	test('returns the public profile DTO', async() => {
		const user = await seedUser({ username: 'critic7', honestyScore: 62 })

		const response = await request(app).get('/users/critic7')

		expect(response.status).toBe(200)
		expect(response.body).toEqual({
			username: 'critic7',
			honestyScore: 62,
			isLowTrust: false,
			isPhoneVerified: false,
			createdAt: user.createdAt.toISOString()
		})
	})

	test('never leaks email or phoneNumberHash', async() => {
		await seedUser({ username: 'critic7', email: 'critic7@example.com' })

		const response = await request(app).get('/users/critic7')

		expect(response.body).not.toHaveProperty('email')
		expect(response.body).not.toHaveProperty('phoneNumberHash')
	})

	test('404s for an unknown username', async() => {
		const response = await request(app).get('/users/nobody')

		expect(response.status).toBe(404)
		expect(response.body).toEqual({
			error: { code: 'NOT_FOUND', message: 'User not found.' }
		})
	})
})

describe('GET /users/:username/reviews', () => {
	test('lists only that user\'s reviews, paginated, newest first', async() => {
		const author = await seedUser({ username: 'critic7', email: 'critic7@example.com' })

		await seedUser({ username: 'someoneElse', email: 'someone-else@example.com' })
		await Review.create({
			userId: author._id, movieId: 550, comment: 'First.', createdAt: new Date('2026-01-01T00:00:00.000Z'), ...CRITERIA_SCORES
		})
		await Review.create({
			userId: author._id, movieId: 551, comment: 'Second.', createdAt: new Date('2026-01-02T00:00:00.000Z'), ...CRITERIA_SCORES
		})

		const response = await request(app).get('/users/critic7/reviews')

		expect(response.status).toBe(200)
		expect(response.body.totalResults).toBe(2)
		expect(response.body.results).toHaveLength(2)
		expect(response.body.results[0].movieId).toBe(551)
		expect(response.body.results.every((review: { author: { username: string } }) => review.author.username === 'critic7')).toBe(true)
	})

	test('reports the requesting viewer\'s own vote on each review', async() => {
		const author = await seedUser({ username: 'critic7', email: 'critic7@example.com' })
		const viewer = await seedUser({ username: 'voter1', email: 'voter1@example.com' })
		const review = await Review.create({ userId: author._id, movieId: 550, comment: '', ...CRITERIA_SCORES })

		await Vote.create({ voterId: viewer._id, targetType: 'review', targetId: review._id, voteValue: 1, voterWeightAtVote: 1 })

		const response = await request(app)
			.get('/users/critic7/reviews')
			.set('Cookie', sessionCookieFor(viewer))

		expect(response.body.results[0].viewerVote).toBe(1)
		expect(response.body.results[0].netVoteCount).toBe(1)
	})

	test('404s for an unknown username', async() => {
		const response = await request(app).get('/users/nobody/reviews')

		expect(response.status).toBe(404)
	})
})

describe('GET /users/:username/opinions', () => {
	test('lists only that user\'s opinions, paginated, newest first', async() => {
		const author = await seedUser({ username: 'critic7', email: 'critic7@example.com' })

		await seedUser({ username: 'someoneElse', email: 'someone-else@example.com' })
		await TrailerOpinion.create({
			userId: author._id, movieId: 550, hypeLevel: 3, comment: 'First.', createdAt: new Date('2026-01-01T00:00:00.000Z')
		})
		await TrailerOpinion.create({
			userId: author._id, movieId: 551, hypeLevel: 5, comment: 'Second.', createdAt: new Date('2026-01-02T00:00:00.000Z')
		})

		const response = await request(app).get('/users/critic7/opinions')

		expect(response.status).toBe(200)
		expect(response.body.totalResults).toBe(2)
		expect(response.body.results).toHaveLength(2)
		expect(response.body.results[0].movieId).toBe(551)
		expect(response.body.results.every((opinion: { author: { username: string } }) => opinion.author.username === 'critic7')).toBe(true)
	})

	test('404s for an unknown username', async() => {
		const response = await request(app).get('/users/nobody/opinions')

		expect(response.status).toBe(404)
	})
})
