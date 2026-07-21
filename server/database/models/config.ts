import mongoose, { Schema } from 'mongoose'

export const DEFAULT_LOW_TRUST_BADGE_THRESHOLD = 30
export const DEFAULT_VOTE_WEIGHT_FLOOR = 0.2

export interface ConfigDocument extends mongoose.Document {
	// Fixed constant, never varies — the unique index on it is what makes
	// this a singleton at the database level (see getConfig in
	// server/lib/config.ts for the upsert that relies on it).
	singletonKey: string
	lowTrustBadgeThreshold: number
	voteWeightFloor: number
}

const configSchema = new Schema<ConfigDocument>({
	singletonKey: { type: String, default: 'singleton', unique: true },
	lowTrustBadgeThreshold: { type: Number, default: DEFAULT_LOW_TRUST_BADGE_THRESHOLD },
	voteWeightFloor: { type: Number, default: DEFAULT_VOTE_WEIGHT_FLOOR }
})

export const Config = mongoose.models.Config || mongoose.model<ConfigDocument>('Config', configSchema)
