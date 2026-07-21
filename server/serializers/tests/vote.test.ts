import { toVotePublicDTO } from '../vote'

const vote = {
	id: '507f1f77bcf86cd799439012',
	voterId: { toString: () => '507f1f77bcf86cd799439013' },
	targetType: 'review',
	targetId: { toString: () => '507f1f77bcf86cd799439014' },
	voteValue: 1,
	voterWeightAtVote: 0.6,
	createdAt: new Date('2026-01-01T00:00:00.000Z')
}

describe('vote serializer allowlist', () => {
	test('public DTO drops voterId to avoid deanonymizing who voted on what', () => {
		const dto = toVotePublicDTO(vote as never)

		expect(Object.keys(dto).sort()).toEqual(['createdAt', 'targetId', 'targetType', 'voteValue', 'voterWeightAtVote'])
		expect(dto).not.toHaveProperty('voterId')
	})
})
