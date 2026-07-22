import { HonestyLog } from '../../database/models/honesty-log'
import { User } from '../../database/models/User'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../test-support/database'
import { computeDecayedHonestyScore, enqueueHonestyScoreRecalculation, recalculateHonestyScore } from '../honesty-score'

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
})

afterAll(async() => {
	await disconnectTestDatabase()
})

afterEach(async() => {
	await clearTestDatabase()
})

describe('recalculateHonestyScore', () => {
	test('writes the recalculated score back onto the user document', async() => {
		const user = await User.create({ username: 'critic7', email: 'critic7@example.com' })

		await HonestyLog.create({ userId: user.id, delta: 25, reason: 'received an upvote' })

		const score = await recalculateHonestyScore(user.id)

		expect(score).toBe(75)

		const reloaded = await User.findById(user.id)

		expect(reloaded?.honestyScore).toBe(75)
	})

	test('a user with no HonestyLog entries settles back to the neutral baseline', async() => {
		const user = await User.create({ username: 'critic8', email: 'critic8@example.com', honestyScore: 90 })

		const score = await recalculateHonestyScore(user.id)

		expect(score).toBe(50)

		const reloaded = await User.findById(user.id)

		expect(reloaded?.honestyScore).toBe(50)
	})
})

describe('enqueueHonestyScoreRecalculation concurrency (audit #2 regression)', () => {
	test('two calls queued back to back for the same user never lose an update', async() => {
		const user = await User.create({ username: 'critic9', email: 'critic9@example.com' })

		// Deltas deliberately differ (not both +25) — if the earlier call's
		// stale read were allowed to overwrite the later call's complete one,
		// the two candidate results would be distinguishable rather than
		// coincidentally identical.
		await HonestyLog.create({ userId: user.id, delta: 25, reason: 'vote A' })
		enqueueHonestyScoreRecalculation(user.id)

		await HonestyLog.create({ userId: user.id, delta: -25, reason: 'vote B' })
		enqueueHonestyScoreRecalculation(user.id)

		const logs = await HonestyLog.find({ userId: user.id }).select('delta createdAt').lean()
		const trueScore = computeDecayedHonestyScore(logs.map(log => ({ delta: log.delta, createdAt: log.createdAt })))

		await waitForHonestyScore(user.id, current => Math.abs(current - trueScore) < 0.001)

		const reloaded = await User.findById(user.id)

		expect(reloaded?.honestyScore).toBeCloseTo(trueScore, 3)
	})

	test('many overlapping recalculations for the same user still converge on the complete result', async() => {
		const user = await User.create({ username: 'critic10', email: 'critic10@example.com' })

		for (let index = 0; index < 10; index++) {
			await HonestyLog.create({ userId: user.id, delta: index % 2 === 0 ? 10 : -10, reason: `event ${index}` })
			enqueueHonestyScoreRecalculation(user.id)
		}

		const logs = await HonestyLog.find({ userId: user.id }).select('delta createdAt').lean()
		const trueScore = computeDecayedHonestyScore(logs.map(log => ({ delta: log.delta, createdAt: log.createdAt })))

		await waitForHonestyScore(user.id, current => Math.abs(current - trueScore) < 0.001)

		const reloaded = await User.findById(user.id)

		expect(reloaded?.honestyScore).toBeCloseTo(trueScore, 3)
	})
})
