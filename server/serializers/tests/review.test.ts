import { toReviewPublicDTO } from '../review'

const user = {
	username: 'critic7',
	email: 'critic7@example.com',
	honestyScore: 45,
	isPhoneVerified: true,
	phoneNumberHash: 'salt:hash'
}

const review = {
	id: '507f1f77bcf86cd799439012',
	userId: user,
	movieId: 550,
	plot: 8,
	acting: 7,
	writing: 9,
	score: 8,
	directing: 6,
	editing: 7,
	cinematography: 9,
	comment: 'Great third act.',
	createdAt: new Date('2026-01-01T00:00:00.000Z')
}

describe('review serializer allowlist', () => {
	test('public DTO exposes author as UserPublicDTO, never raw userId or email', () => {
		const dto = toReviewPublicDTO(review as never, { netVoteCount: 3, viewerVote: 1 })

		expect(Object.keys(dto).sort()).toEqual(
			[
				'acting', 'author', 'cinematography', 'comment', 'createdAt', 'directing', 'editing', 'id', 'movieId',
				'netVoteCount', 'plot', 'score', 'viewerVote', 'writing'
			].sort()
		)
		expect(dto.netVoteCount).toBe(3)
		expect(dto.viewerVote).toBe(1)
		expect(dto).not.toHaveProperty('userId')
		expect(dto.author).toEqual({
			username: 'critic7',
			honestyScore: 45,
			isLowTrust: false,
			isPhoneVerified: true
		})
	})

	test('author.isLowTrust reflects the low-trust threshold', () => {
		const lowTrustReview = { ...review, userId: { ...user, honestyScore: 10 } }

		expect(toReviewPublicDTO(lowTrustReview as never, { netVoteCount: 0, viewerVote: null }).author.isLowTrust).toBe(true)
	})
})
