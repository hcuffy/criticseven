import { VoteDocument, VoteTargetType } from '../database/models/vote'

export interface VotePublicDTO {
	targetType: VoteTargetType
	targetId: string
	voteValue: 1 | -1
	voterWeightAtVote: number
	createdAt: Date
}

// voterId deliberately not included: a public vote tally/listing that names
// the voter on every review or opinion is exactly the "who voted on what"
// deanonymization the data-minimization gate rules out for HonestyLog, and
// the same reasoning applies here.
export function toVotePublicDTO(vote: VoteDocument): VotePublicDTO {
	return {
		targetType: vote.targetType,
		targetId: vote.targetId.toString(),
		voteValue: vote.voteValue,
		voterWeightAtVote: vote.voterWeightAtVote,
		createdAt: vote.createdAt
	}
}
