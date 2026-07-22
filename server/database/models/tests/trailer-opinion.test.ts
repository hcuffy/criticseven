import mongoose from 'mongoose'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../../test-support/database'
import { TrailerOpinion } from '../trailer-opinion'

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

describe('TrailerOpinion unique index', () => {
	test('a second opinion by the same user on the same movie is rejected at the database level', async() => {
		const userId = new mongoose.Types.ObjectId()

		await TrailerOpinion.create({ userId, movieId: 550, hypeLevel: 4, comment: 'Hyped.' })

		await expect(
			TrailerOpinion.create({ userId, movieId: 550, hypeLevel: 2, comment: 'Changed my mind.' })
		).rejects.toThrow()
	})

	test('the same user sharing opinions on two different movies is allowed', async() => {
		const userId = new mongoose.Types.ObjectId()

		await TrailerOpinion.create({ userId, movieId: 550, hypeLevel: 4, comment: 'Hyped.' })

		await expect(
			TrailerOpinion.create({ userId, movieId: 551, hypeLevel: 3, comment: 'Cautiously optimistic.' })
		).resolves.toBeTruthy()
	})

	test('different users can each opine on the same movie', async() => {
		await TrailerOpinion.create({ userId: new mongoose.Types.ObjectId(), movieId: 550, hypeLevel: 4, comment: '' })

		await expect(
			TrailerOpinion.create({ userId: new mongoose.Types.ObjectId(), movieId: 550, hypeLevel: 1, comment: '' })
		).resolves.toBeTruthy()
	})
})
