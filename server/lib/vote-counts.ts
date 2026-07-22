import mongoose from 'mongoose'
import { Vote, VoteTargetType } from '../database/models/vote'

export interface VoteSummary {
	netVoteCount: number
	// The requesting viewer's own vote on this target, so the client knows
	// which button to render active (and can toggle it off via DELETE
	// /votes rather than re-submitting the same value) — null both when the
	// viewer hasn't voted and when there is no authenticated viewer at all.
	viewerVote: 1 | -1 | null
}

// DEFERRED (audit #11, documented not built — no real traffic yet):
// netVoteCount is computed live via aggregation on every page load, not
// denormalized. Fine at current scale; before real traffic this needs a
// counter cache instead — e.g. $inc a netVoteCount field on the
// TrailerOpinion/Review document itself at vote create/change/delete time
// (server/actions/votes.ts), so listing pages stop touching the Votes
// collection at all.
//
// Keyed by targetId string so callers can look up a summary per item
// without caring about ObjectId identity comparisons.
export async function getVoteSummaries(
	targetType: VoteTargetType,
	targetIds: mongoose.Types.ObjectId[],
	viewerId: string | null
): Promise<Map<string, VoteSummary>> {
	if (targetIds.length === 0) {
		return new Map()
	}

	const [netVoteResults, viewerVotes] = await Promise.all([
		Vote.aggregate<{ _id: mongoose.Types.ObjectId; netVoteCount: number }>([
			{ $match: { targetType, targetId: { $in: targetIds } } },
			{ $group: { _id: '$targetId', netVoteCount: { $sum: '$voteValue' } } }
		]),
		viewerId
			? Vote.find({ voterId: viewerId, targetType, targetId: { $in: targetIds } }).select('targetId voteValue')
			: Promise.resolve([])
	])

	const netVoteCountByTargetId = new Map(netVoteResults.map(result => [result._id.toString(), result.netVoteCount]))
	const viewerVoteByTargetId = new Map(viewerVotes.map(vote => [vote.targetId.toString(), vote.voteValue]))

	const targetIdStrings = new Set([
		...netVoteCountByTargetId.keys(),
		...targetIds.map(targetId => targetId.toString())
	])

	return new Map(
		Array.from(targetIdStrings, targetIdString => [
			targetIdString,
			{
				netVoteCount: netVoteCountByTargetId.get(targetIdString) ?? 0,
				viewerVote: viewerVoteByTargetId.get(targetIdString) ?? null
			}
		])
	)
}
