import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { HonestyLog } from '../database/models/honesty-log'
import { Review } from '../database/models/review'
import { TrailerOpinion } from '../database/models/trailer-opinion'
import { User } from '../database/models/User'
import { Vote, VoteDocument, VoteTargetType } from '../database/models/vote'
import { getConfig } from '../lib/config'
import { computeVoterWeight, enqueueHonestyScoreRecalculation } from '../lib/honesty-score'
import { isUserRateLimited, recordUserAttempt } from '../lib/rate-limit'
import { toVotePublicDTO } from '../serializers'
import { getAuthenticatedUserId, SESSION_COOKIE_NAME } from '../session'

// Precedent set by server/lib/tests/honesty-score-recalculation.test.ts
// (`HonestyLog.create({ delta: 25, reason: 'received an upvote' })`): a
// full-weight (honestyScore 100, weight 1.0) vote is worth 25 points on the
// target author's log. Actual impact is scaled by the voter's weight and
// moderated further by computeDecayedHonestyScore's weighted-average (not
// sum) across a user's whole log, so no single vote — even a full-weight
// one — can swing a score on its own the way this constant might suggest.
const VOTE_HONESTY_DELTA_MAGNITUDE = 25

// Shared budget across POST and DELETE /votes (scope 'vote') — cast,
// change, and remove all draw from the same 100/hr cap, so cycling
// create+delete can't double the effective throughput (audit #8).
const VOTE_RATE_LIMIT = 100
const VOTE_RATE_WINDOW_MS = 60 * 60 * 1000

const TARGET_MODELS: Record<VoteTargetType, typeof TrailerOpinion | typeof Review> = {
	opinion: TrailerOpinion,
	review: Review
}

const UNAUTHORIZED = {
	error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
}

function isValidTargetType(value: unknown): value is VoteTargetType {
	return value === 'opinion' || value === 'review'
}

function voteLabel(voteValue: 1 | -1): string {
	return voteValue === 1 ? 'upvote' : 'downvote'
}

function voteReasonFor(voteValue: 1 | -1): string {
	return `received a${voteValue === 1 ? 'n' : ''} ${voteLabel(voteValue)}`
}

// Same trust boundary as server/actions/opinions.ts and reviews.ts:
// identity comes from the signed `__session` cookie, never a request body
// field — Express is directly reachable over the network.
export const castVote = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const voterId = getAuthenticatedUserId(request.cookies?.[SESSION_COOKIE_NAME])

		if (!voterId) {
			response.status(401).json(UNAUTHORIZED)
			return
		}

		const { targetType, targetId, voteValue } = request.body as {
			targetType?: unknown
			targetId?: unknown
			voteValue?: unknown
		}

		if (!isValidTargetType(targetType) || typeof targetId !== 'string' || !mongoose.isValidObjectId(targetId) ||
			(voteValue !== 1 && voteValue !== -1)) {
			response.status(400).json({
				error: { code: 'INVALID_VOTE', message: 'targetType, targetId, and voteValue (1 or -1) are required' }
			})
			return
		}

		if (await isUserRateLimited('vote', voterId, VOTE_RATE_LIMIT, VOTE_RATE_WINDOW_MS)) {
			response.status(429).json({
				error: { code: 'RATE_LIMITED', message: 'Too many votes — try again later.' }
			})
			return
		}

		// Recorded here — past shape validation and the rate-limit check
		// itself, same as server/lib/rate-limit.ts's auth attempts — so a
		// script hammering with invalid/self/nonexistent targets still burns
		// its budget rather than getting free retries.
		await recordUserAttempt('vote', voterId)

		const target = await TARGET_MODELS[targetType].findById(targetId).select('userId')

		if (!target) {
			response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vote target not found.' } })
			return
		}

		if (target.userId.toString() === voterId) {
			response.status(403).json({
				error: { code: 'SELF_VOTE_NOT_ALLOWED', message: 'You cannot vote on your own opinion or review.' }
			})
			return
		}

		const [voter, config, existingVote] = await Promise.all([
			User.findById(voterId).select('honestyScore'),
			getConfig(),
			Vote.findOne({ voterId, targetType, targetId })
		])

		if (!voter) {
			response.status(401).json(UNAUTHORIZED)
			return
		}

		const previousVoteValue = existingVote?.voteValue ?? null

		if (previousVoteValue === voteValue) {
			// Idempotent resubmission of the same vote — no state change, no
			// honesty-log churn, just echo back the existing vote.
			response.status(200).json(toVotePublicDTO(existingVote as VoteDocument))
			return
		}

		const voterWeightAtVote = computeVoterWeight(voter.honestyScore, config.voteWeightFloor)

		const vote = await Vote.findOneAndUpdate(
			{ voterId, targetType, targetId },
			{ voteValue, voterWeightAtVote, createdAt: new Date() },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		)

		// delta is this vote's full current contribution, not an incremental
		// swing — the findOneAndUpdate below REPLACES the one HonestyLog entry
		// tied to this vote (keyed by voteId) rather than appending a
		// corrective entry on top of the superseded one. That's what keeps
		// HonestyLog mirroring the live vote set 1:1: a vote that has changed
		// three times still has exactly one log entry, reflecting only its
		// current value, so the weighted-average recalculation never carries
		// residue from a vote's earlier values (see server/lib/honesty-score.ts
		// and the audit's forced-interleaving/delta-on-change findings).
		const delta = voteValue * voterWeightAtVote * VOTE_HONESTY_DELTA_MAGNITUDE
		const reason = previousVoteValue === null
			? voteReasonFor(voteValue)
			: `vote changed from ${voteLabel(previousVoteValue)} to ${voteLabel(voteValue)}`

		await HonestyLog.findOneAndUpdate(
			{ voteId: vote._id },
			{ userId: target.userId, delta, reason, createdAt: new Date() },
			{ upsert: true, setDefaultsOnInsert: true }
		)
		enqueueHonestyScoreRecalculation(target.userId.toString())

		response.status(previousVoteValue === null ? 201 : 200).json(toVotePublicDTO(vote as VoteDocument))
	} catch (error) {
		next(error)
	}
}

export const removeVote = async(request: Request, response: Response, next: NextFunction) => {
	try {
		const voterId = getAuthenticatedUserId(request.cookies?.[SESSION_COOKIE_NAME])

		if (!voterId) {
			response.status(401).json(UNAUTHORIZED)
			return
		}

		const { targetType, targetId } = request.body as { targetType?: unknown; targetId?: unknown }

		if (!isValidTargetType(targetType) || typeof targetId !== 'string' || !mongoose.isValidObjectId(targetId)) {
			response.status(400).json({
				error: { code: 'INVALID_VOTE', message: 'targetType and targetId are required' }
			})
			return
		}

		// Same shared 'vote' budget as castVote — previously unrated, which
		// let a create-then-delete cycle dodge the cap entirely (audit #8).
		if (await isUserRateLimited('vote', voterId, VOTE_RATE_LIMIT, VOTE_RATE_WINDOW_MS)) {
			response.status(429).json({
				error: { code: 'RATE_LIMITED', message: 'Too many votes — try again later.' }
			})
			return
		}

		await recordUserAttempt('vote', voterId)

		const deletedVote = await Vote.findOneAndDelete({ voterId, targetType, targetId })

		if (!deletedVote) {
			response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vote not found.' } })
			return
		}

		const vote = deletedVote as unknown as VoteDocument

		// Removes the entry tied to this vote outright — no reversal entry
		// needed, since there's nothing left in the log to reverse against
		// (see the comment on HonestyLogDocument.voteId). This also closes a
		// gap the previous reversal-entry design had: it ran only when the
		// target still existed, so a vote on an already-deleted target left
		// its original contribution stuck in the log forever. Removing by
		// voteId doesn't depend on the target existing at all.
		await HonestyLog.deleteOne({ voteId: vote._id })

		const target = await TARGET_MODELS[vote.targetType].findById(vote.targetId).select('userId')

		if (target) {
			enqueueHonestyScoreRecalculation(target.userId.toString())
		}

		response.status(204).send()
	} catch (error) {
		next(error)
	}
}
