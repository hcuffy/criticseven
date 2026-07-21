import { Config, DEFAULT_LOW_TRUST_BADGE_THRESHOLD, DEFAULT_VOTE_WEIGHT_FLOOR } from '../../database/models/config'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../test-support/database'
import { getConfig } from '../config'

beforeAll(async() => {
	await connectTestDatabase()
	await Config.init()
})

afterAll(async() => {
	await disconnectTestDatabase()
})

afterEach(async() => {
	await clearTestDatabase()
})

describe('getConfig', () => {
	test('bootstraps a single document with the documented defaults when none exists', async() => {
		const config = await getConfig()

		expect(config.lowTrustBadgeThreshold).toBe(DEFAULT_LOW_TRUST_BADGE_THRESHOLD)
		expect(config.voteWeightFloor).toBe(DEFAULT_VOTE_WEIGHT_FLOOR)
	})

	test('repeated calls return the same document rather than creating another', async() => {
		const first = await getConfig()
		const second = await getConfig()

		expect(second.id).toBe(first.id)
		expect(await Config.countDocuments()).toBe(1)
	})

	test('concurrent bootstrap calls still converge on one document', async() => {
		const [first, second] = await Promise.all([getConfig(), getConfig()])

		expect(second.id).toBe(first.id)
		expect(await Config.countDocuments()).toBe(1)
	})
})
