import cookieParser from 'cookie-parser'
import express from 'express'
import mongoose from 'mongoose'
import request from 'supertest'
import { HonestyLog } from '../../database/models/honesty-log'
import { TrailerOpinion } from '../../database/models/trailer-opinion'
import { User, UserDocument } from '../../database/models/User'
import { Vote } from '../../database/models/vote'
import movieRoutes from '../../routes/movie-routes'
import opinionRoutes from '../../routes/opinion-routes'
import reviewRoutes from '../../routes/review-routes'
import voteRoutes from '../../routes/vote-routes'
import { SESSION_COOKIE_NAME } from '../../session'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../test-support/database'
import { createSignedSessionCookieValue } from '../../test-support/session'

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use('/votes', voteRoutes())
app.use('/opinions', opinionRoutes())
app.use('/reviews', reviewRoutes())
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

async function seedOpinion(authorId: string) {
	return TrailerOpinion.create({ userId: authorId, movieId: 550, hypeLevel: 4, comment: '' })
}

async function waitForHonestyScore(
	userId: string,
	predicate: (score: number) => boolean,
	timeoutMs = 2000
): Promise<number> {
	const start = Date.now()

	while (Date.now() - start < timeoutMs) {
		const user = await User.findById(userId).select('honestyScore')

		if (user && predicate(user.honestyScore)) {
			return user.honestyScore
		}

		await new Promise(resolve => setTimeout(resolve, 10))
	}

	throw new Error('Timed out waiting for honesty score to update')
}

beforeAll(async() => {
	await connectTestDatabase()
	await Vote.init()
})

afterAll(async() => {
	await disconnectTestDatabase()
})

afterEach(async() => {
	await clearTestDatabase()
})

describe('POST /votes', () => {
	test('rejects a request with no session cookie', async() => {
		const response = await request(app)
			.post('/votes')
			.send({ targetType: 'opinion', targetId: '507f1f77bcf86cd799439011', voteValue: 1 })

		expect(response.status).toBe(401)
	})

	test('rejects an invalid body', async() => {
		const voter = await seedUser()

		const response = await request(app)
			.post('/votes')
			.set('Cookie', sessionCookieFor(voter))
			.send({ targetType: 'not-a-type', targetId: 'not-an-id', voteValue: 2 })

		expect(response.status).toBe(400)
	})

	test('rejects a 404 for a target that does not exist', async() => {
		const voter = await seedUser()

		const response = await request(app)
			.post('/votes')
			.set('Cookie', sessionCookieFor(voter))
			.send({ targetType: 'opinion', targetId: '507f1f77bcf86cd799439011', voteValue: 1 })

		expect(response.status).toBe(404)
	})

	test('blocks self-voting', async() => {
		const author = await seedUser()
		const opinion = await seedOpinion(author.id)

		const response = await request(app)
			.post('/votes')
			.set('Cookie', sessionCookieFor(author))
			.send({ targetType: 'opinion', targetId: opinion.id, voteValue: 1 })

		expect(response.status).toBe(403)
		expect(response.body).toEqual({
			error: { code: 'SELF_VOTE_NOT_ALLOWED', message: 'You cannot vote on your own opinion or review.' }
		})
	})

	test('ignores a body-supplied voterId — cannot vote as someone else by curling directly', async() => {
		const author = await seedUser({ username: 'author', email: 'author@example.com' })
		const voter = await seedUser({ username: 'voter', email: 'voter@example.com' })
		const impersonationTarget = await seedUser({ username: 'someone-else', email: 'else@example.com' })
		const opinion = await seedOpinion(author.id)

		const response = await request(app)
			.post('/votes')
			.set('Cookie', sessionCookieFor(voter))
			.send({ voterId: impersonationTarget.id, targetType: 'opinion', targetId: opinion.id, voteValue: 1 })

		expect(response.status).toBe(201)

		const stored = await Vote.findOne({ targetType: 'opinion', targetId: opinion.id })

		expect(stored?.voterId.toString()).toBe(voter.id)
	})

	test('one vote per user per target — a second vote changes the existing vote instead of creating a new one', async() => {
		const author = await seedUser({ username: 'author', email: 'author@example.com' })
		const voter = await seedUser({ username: 'voter', email: 'voter@example.com' })
		const opinion = await seedOpinion(author.id)
		const cookie = sessionCookieFor(voter)

		const first = await request(app)
			.post('/votes')
			.set('Cookie', cookie)
			.send({ targetType: 'opinion', targetId: opinion.id, voteValue: 1 })

		expect(first.status).toBe(201)

		const second = await request(app)
			.post('/votes')
			.set('Cookie', cookie)
			.send({ targetType: 'opinion', targetId: opinion.id, voteValue: -1 })

		expect(second.status).toBe(200)
		expect(second.body.voteValue).toBe(-1)

		const votesForTarget = await Vote.find({ targetType: 'opinion', targetId: opinion.id })

		expect(votesForTarget).toHaveLength(1)
		expect(votesForTarget[0].voteValue).toBe(-1)
	})

	test('resubmitting the same vote value is idempotent', async() => {
		const author = await seedUser({ username: 'author', email: 'author@example.com' })
		const voter = await seedUser({ username: 'voter', email: 'voter@example.com' })
		const opinion = await seedOpinion(author.id)
		const cookie = sessionCookieFor(voter)

		await request(app).post('/votes').set('Cookie', cookie).send({ targetType: 'opinion', targetId: opinion.id, voteValue: 1 })

		const response = await request(app)
			.post('/votes')
			.set('Cookie', cookie)
			.send({ targetType: 'opinion', targetId: opinion.id, voteValue: 1 })

		expect(response.status).toBe(200)

		const votesForTarget = await Vote.find({ targetType: 'opinion', targetId: opinion.id })

		expect(votesForTarget).toHaveLength(1)
	})

	test('rate limits after 100 votes in the last hour', async() => {
		const voter = await seedUser()

		await Vote.insertMany(
			Array.from({ length: 100 }, () => ({
				voterId: voter.id,
				targetType: 'opinion',
				targetId: new mongoose.Types.ObjectId(),
				voteValue: 1,
				voterWeightAtVote: 1
			}))
		)

		const response = await request(app)
			.post('/votes')
			.set('Cookie', sessionCookieFor(voter))
			.send({ targetType: 'opinion', targetId: '507f1f77bcf86cd799439011', voteValue: 1 })

		expect(response.status).toBe(429)
	})
})

describe('voterWeightAtVote snapshot', () => {
	test('a low-honesty-score voter contributes a smaller honesty-log delta than a high-score voter', async() => {
		const author = await seedUser({ username: 'author', email: 'author@example.com' })
		const lowScoreVoter = await seedUser({ username: 'low-score', email: 'low@example.com', honestyScore: 0 })
		const highScoreVoter = await seedUser({ username: 'high-score', email: 'high@example.com', honestyScore: 100 })
		const opinionForLowVoter = await seedOpinion(author.id)
		const opinionForHighVoter = await TrailerOpinion.create({
			userId: author.id, movieId: 551, hypeLevel: 3, comment: ''
		})

		await request(app)
			.post('/votes')
			.set('Cookie', sessionCookieFor(lowScoreVoter))
			.send({ targetType: 'opinion', targetId: opinionForLowVoter.id, voteValue: 1 })

		await request(app)
			.post('/votes')
			.set('Cookie', sessionCookieFor(highScoreVoter))
			.send({ targetType: 'opinion', targetId: opinionForHighVoter.id, voteValue: 1 })

		const lowVote = await Vote.findOne({ targetType: 'opinion', targetId: opinionForLowVoter.id })
		const highVote = await Vote.findOne({ targetType: 'opinion', targetId: opinionForHighVoter.id })

		// voteWeightFloor defaults to 0.2 (server/database/models/config.ts) —
		// score 0 -> weight 0.2, score 100 -> weight 1.0.
		expect(lowVote?.voterWeightAtVote).toBeCloseTo(0.2)
		expect(highVote?.voterWeightAtVote).toBe(1)

		const logs = await HonestyLog.find({ userId: author.id }).sort({ createdAt: 1 })

		expect(logs).toHaveLength(2)
		expect(logs[0].delta).toBeCloseTo(5) // 1 * 0.2 * 25
		expect(logs[1].delta).toBeCloseTo(25) // 1 * 1.0 * 25
		expect(Math.abs(logs[1].delta)).toBeGreaterThan(Math.abs(logs[0].delta))
	})
})

describe('honesty score recalculation', () => {
	test('triggers on vote create — target author score moves up', async() => {
		const author = await seedUser({ username: 'author', email: 'author@example.com' })
		const voter = await seedUser({ username: 'voter', email: 'voter@example.com', honestyScore: 100 })
		const opinion = await seedOpinion(author.id)

		await request(app)
			.post('/votes')
			.set('Cookie', sessionCookieFor(voter))
			.send({ targetType: 'opinion', targetId: opinion.id, voteValue: 1 })

		const score = await waitForHonestyScore(author.id, current => current > 50)

		expect(score).toBe(75)
	})

	test('triggers on vote change — target author score moves down after up becomes down', async() => {
		const author = await seedUser({ username: 'author', email: 'author@example.com' })
		const voter = await seedUser({ username: 'voter', email: 'voter@example.com', honestyScore: 100 })
		const opinion = await seedOpinion(author.id)
		const cookie = sessionCookieFor(voter)

		await request(app).post('/votes').set('Cookie', cookie).send({ targetType: 'opinion', targetId: opinion.id, voteValue: 1 })
		await waitForHonestyScore(author.id, current => current > 50)

		await request(app).post('/votes').set('Cookie', cookie).send({ targetType: 'opinion', targetId: opinion.id, voteValue: -1 })
		const score = await waitForHonestyScore(author.id, current => current < 50)

		expect(score).toBeLessThan(50)
	})

	test('triggers on vote delete — reverses the honesty-log contribution', async() => {
		const author = await seedUser({ username: 'author', email: 'author@example.com' })
		const voter = await seedUser({ username: 'voter', email: 'voter@example.com', honestyScore: 100 })
		const opinion = await seedOpinion(author.id)
		const cookie = sessionCookieFor(voter)

		await request(app).post('/votes').set('Cookie', cookie).send({ targetType: 'opinion', targetId: opinion.id, voteValue: 1 })
		await waitForHonestyScore(author.id, current => current > 50)

		const deleteResponse = await request(app)
			.delete('/votes')
			.set('Cookie', cookie)
			.send({ targetType: 'opinion', targetId: opinion.id })

		expect(deleteResponse.status).toBe(204)

		// The create (+25) and reversal (-25) entries land milliseconds apart,
		// so their time-decay weights aren't bit-for-bit identical — the score
		// settles very close to, but not always exactly, the 50 baseline.
		const score = await waitForHonestyScore(author.id, current => Math.abs(current - 50) < 0.01)

		expect(score).toBeCloseTo(50, 1)

		const logs = await HonestyLog.find({ userId: author.id }).sort({ createdAt: 1 })

		expect(logs).toHaveLength(2)
		expect(logs[1].reason).toBe('upvote removed')
		expect(logs[1].delta).toBeCloseTo(-25)
	})
})

describe('DELETE /votes', () => {
	test('rejects a request with no session cookie', async() => {
		const response = await request(app)
			.delete('/votes')
			.send({ targetType: 'opinion', targetId: '507f1f77bcf86cd799439011' })

		expect(response.status).toBe(401)
	})

	test('returns 404 when there is no vote to remove', async() => {
		const voter = await seedUser()

		const response = await request(app)
			.delete('/votes')
			.set('Cookie', sessionCookieFor(voter))
			.send({ targetType: 'opinion', targetId: '507f1f77bcf86cd799439011' })

		expect(response.status).toBe(404)
	})

	test('removes the vote', async() => {
		const author = await seedUser({ username: 'author', email: 'author@example.com' })
		const voter = await seedUser({ username: 'voter', email: 'voter@example.com' })
		const opinion = await seedOpinion(author.id)
		const cookie = sessionCookieFor(voter)

		await request(app).post('/votes').set('Cookie', cookie).send({ targetType: 'opinion', targetId: opinion.id, voteValue: 1 })

		const response = await request(app)
			.delete('/votes')
			.set('Cookie', cookie)
			.send({ targetType: 'opinion', targetId: opinion.id })

		expect(response.status).toBe(204)
		expect(await Vote.countDocuments({ targetType: 'opinion', targetId: opinion.id })).toBe(0)
	})
})

describe('net vote count on opinion listings', () => {
	test('GET /movies/:movieId/opinions reflects the sum of vote values', async() => {
		const author = await seedUser({ username: 'author', email: 'author@example.com' })
		const upvoterA = await seedUser({ username: 'up-a', email: 'up-a@example.com' })
		const upvoterB = await seedUser({ username: 'up-b', email: 'up-b@example.com' })
		const downvoter = await seedUser({ username: 'down', email: 'down@example.com' })
		const opinion = await seedOpinion(author.id)

		await request(app).post('/votes').set('Cookie', sessionCookieFor(upvoterA)).send({
			targetType: 'opinion', targetId: opinion.id, voteValue: 1
		})
		await request(app).post('/votes').set('Cookie', sessionCookieFor(upvoterB)).send({
			targetType: 'opinion', targetId: opinion.id, voteValue: 1
		})
		await request(app).post('/votes').set('Cookie', sessionCookieFor(downvoter)).send({
			targetType: 'opinion', targetId: opinion.id, voteValue: -1
		})

		const response = await request(app).get('/movies/550/opinions')

		expect(response.status).toBe(200)
		expect(response.body.results).toHaveLength(1)
		expect(response.body.results[0].netVoteCount).toBe(1) // +1 +1 -1
	})

	test('a freshly created opinion has netVoteCount 0', async() => {
		const author = await seedUser()

		const created = await request(app)
			.post('/opinions')
			.set('Cookie', sessionCookieFor(author))
			.send({ movieId: 999, hypeLevel: 3, comment: '' })

		expect(created.body.netVoteCount).toBe(0)
	})

	test('viewerVote reflects the requesting session\'s own vote, is null for a different or absent viewer', async() => {
		const author = await seedUser({ username: 'author', email: 'author@example.com' })
		const upvoter = await seedUser({ username: 'up', email: 'up@example.com' })
		const bystander = await seedUser({ username: 'bystander', email: 'bystander@example.com' })
		const opinion = await seedOpinion(author.id)

		await request(app).post('/votes').set('Cookie', sessionCookieFor(upvoter)).send({
			targetType: 'opinion', targetId: opinion.id, voteValue: 1
		})

		const asUpvoter = await request(app).get('/movies/550/opinions').set('Cookie', sessionCookieFor(upvoter))

		expect(asUpvoter.body.results[0].viewerVote).toBe(1)

		const asBystander = await request(app).get('/movies/550/opinions').set('Cookie', sessionCookieFor(bystander))

		expect(asBystander.body.results[0].viewerVote).toBeNull()

		const asGuest = await request(app).get('/movies/550/opinions')

		expect(asGuest.body.results[0].viewerVote).toBeNull()
	})
})
