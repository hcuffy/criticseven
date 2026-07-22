import mongoose, { Schema } from 'mongoose'

export interface HonestyLogDocument extends mongoose.Document {
	userId: mongoose.Types.ObjectId
	delta: number
	reason: string
	// Links this entry to the Vote that produced it, so a vote change/delete
	// (server/actions/votes.ts) can replace or remove the exact entry
	// instead of appending a corrective one on top of it — HonestyLog then
	// always mirrors the live vote set 1:1, so the weighted-average
	// recalculation (server/lib/honesty-score.ts) never carries residue
	// from a superseded or retracted vote. null for entries that don't
	// originate from a vote (none yet, but the field exists for them).
	voteId: mongoose.Types.ObjectId | null
	createdAt: Date
}

const honestyLogSchema = new Schema<HonestyLogDocument>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	delta: { type: Number, required: true },
	reason: { type: String, required: true },
	voteId: { type: Schema.Types.ObjectId, ref: 'Vote', default: null },
	createdAt: { type: Date, default: Date.now }
})

// Recalculation job (server/lib/honesty-score.ts) reads a user's entries
// ordered by recency — index matches that access pattern.
honestyLogSchema.index({ userId: 1, createdAt: -1 })

// Sparse since only vote-originated entries set this — backs the
// replace-by-voteId / delete-by-voteId writes in server/actions/votes.ts.
honestyLogSchema.index({ voteId: 1 }, { sparse: true })

export const HonestyLog =
	mongoose.models.HonestyLog || mongoose.model<HonestyLogDocument>('HonestyLog', honestyLogSchema)
