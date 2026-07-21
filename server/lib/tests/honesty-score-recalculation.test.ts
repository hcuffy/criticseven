import { HonestyLog } from '../../database/models/honesty-log'
import { User } from '../../database/models/User'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../test-support/database'
import { recalculateHonestyScore } from '../honesty-score'

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
