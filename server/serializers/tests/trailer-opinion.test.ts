import { toTrailerOpinionPublicDTO } from '../trailer-opinion'

const user = {
	username: 'critic7',
	email: 'critic7@example.com',
	honestyScore: 45,
	isPhoneVerified: true,
	phoneNumberHash: 'salt:hash'
}

const opinion = {
	id: '507f1f77bcf86cd799439012',
	userId: user,
	movieId: 550,
	hypeLevel: 4,
	comment: 'Trailer looks great.',
	createdAt: new Date('2026-01-01T00:00:00.000Z')
}

describe('trailer opinion serializer allowlist', () => {
	test('public DTO exposes author as UserPublicDTO, never raw userId or email', () => {
		const dto = toTrailerOpinionPublicDTO(opinion as never)

		expect(Object.keys(dto).sort()).toEqual(['author', 'comment', 'createdAt', 'hypeLevel', 'id', 'movieId'].sort())
		expect(dto).not.toHaveProperty('userId')
		expect(dto.author).toEqual({
			username: 'critic7',
			honestyScore: 45,
			isLowTrust: false,
			isPhoneVerified: true
		})
	})

	test('author.isLowTrust reflects the low-trust threshold', () => {
		const lowTrustOpinion = { ...opinion, userId: { ...user, honestyScore: 10 } }

		expect(toTrailerOpinionPublicDTO(lowTrustOpinion as never).author.isLowTrust).toBe(true)
	})
})
