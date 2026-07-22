import mongoose from 'mongoose'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../../test-support/database'
import { Review } from '../review'

const CRITERIA_SCORES = {
	plot: 8, acting: 7, writing: 9, score: 8, directing: 6, editing: 7, cinematography: 9
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

describe('Review unique index', () => {
	test('a second review by the same user on the same movie is rejected at the database level', async() => {
		const userId = new mongoose.Types.ObjectId()

		await Review.create({ userId, movieId: 550, comment: 'Loved it.', ...CRITERIA_SCORES })

		await expect(
			Review.create({ userId, movieId: 550, comment: 'On rewatch, less so.', ...CRITERIA_SCORES })
		).rejects.toThrow()
	})

	test('the same user reviewing two different movies is allowed', async() => {
		const userId = new mongoose.Types.ObjectId()

		await Review.create({ userId, movieId: 550, comment: 'Loved it.', ...CRITERIA_SCORES })

		await expect(
			Review.create({ userId, movieId: 551, comment: 'Also loved it.', ...CRITERIA_SCORES })
		).resolves.toBeTruthy()
	})

	test('different users can each review the same movie', async() => {
		await Review.create({ userId: new mongoose.Types.ObjectId(), movieId: 550, comment: '', ...CRITERIA_SCORES })

		await expect(
			Review.create({ userId: new mongoose.Types.ObjectId(), movieId: 550, comment: '', ...CRITERIA_SCORES })
		).resolves.toBeTruthy()
	})
})
