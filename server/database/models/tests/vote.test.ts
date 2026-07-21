import mongoose from 'mongoose'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../../test-support/database'
import { Vote } from '../vote'

beforeAll(async() => {
	await connectTestDatabase()
	// Index creation is async and otherwise not guaranteed to finish before
	// the first write in a test — without this the uniqueness assertions
	// below would be flaky rather than deterministic.
	await Vote.init()
})

afterAll(async() => {
	await disconnectTestDatabase()
})

afterEach(async() => {
	await clearTestDatabase()
})

describe('Vote unique index', () => {
	test('a second vote by the same voter on the same target is rejected at the database level', async() => {
		const voterId = new mongoose.Types.ObjectId()
		const targetId = new mongoose.Types.ObjectId()

		await Vote.create({ voterId, targetType: 'review', targetId, voteValue: 1, voterWeightAtVote: 1 })

		await expect(
			Vote.create({ voterId, targetType: 'review', targetId, voteValue: -1, voterWeightAtVote: 1 })
		).rejects.toThrow()
	})

	test('the same voter voting on two different targets is allowed', async() => {
		const voterId = new mongoose.Types.ObjectId()

		await Vote.create({
			voterId,
			targetType: 'review',
			targetId: new mongoose.Types.ObjectId(),
			voteValue: 1,
			voterWeightAtVote: 1
		})

		await expect(
			Vote.create({
				voterId,
				targetType: 'review',
				targetId: new mongoose.Types.ObjectId(),
				voteValue: 1,
				voterWeightAtVote: 1
			})
		).resolves.toBeTruthy()
	})
})
