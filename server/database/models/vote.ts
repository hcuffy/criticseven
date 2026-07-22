import mongoose, { Schema } from 'mongoose'

export type VoteTargetType = 'opinion' | 'review'

export interface VoteDocument extends mongoose.Document {
	voterId: mongoose.Types.ObjectId
	targetType: VoteTargetType
	targetId: mongoose.Types.ObjectId
	voteValue: 1 | -1
	// Snapshotted at cast time from the voter's honestyScore, never
	// recomputed retroactively — see server/lib/honesty-score.ts. A voter's
	// later score changes must not alter votes they already cast.
	voterWeightAtVote: number
	createdAt: Date
}

const voteSchema = new Schema<VoteDocument>({
	voterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	targetType: { type: String, enum: ['opinion', 'review'], required: true },
	targetId: { type: Schema.Types.ObjectId, required: true },
	voteValue: { type: Number, enum: [1, -1], required: true },
	voterWeightAtVote: { type: Number, required: true, min: 0, max: 1 },
	createdAt: { type: Date, default: Date.now }
})

// Enforces one vote per user per target at the database level, not just app logic.
voteSchema.index({ voterId: 1, targetType: 1, targetId: 1 }, { unique: true })

// Backs the netVoteCount aggregation (server/lib/vote-counts.ts), which
// matches on {targetType, targetId: {$in: [...]}} with no voterId — the
// unique index above can't serve that (voterId isn't in the query at all),
// so it was running a full collection scan on every opinions/reviews page
// load (audit #13, confirmed via .explain()).
voteSchema.index({ targetType: 1, targetId: 1 })

export const Vote = mongoose.models.Vote || mongoose.model<VoteDocument>('Vote', voteSchema)
