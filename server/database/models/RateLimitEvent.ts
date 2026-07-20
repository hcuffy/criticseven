import mongoose, { Schema } from 'mongoose'

export interface RateLimitEventDocument extends mongoose.Document {
	email: string
	ip: string
	createdAt: Date
}

const rateLimitEventSchema = new Schema<RateLimitEventDocument>({
	email: { type: String, required: true },
	ip: { type: String, required: true },
	createdAt: { type: Date, default: Date.now }
})

rateLimitEventSchema.index({ email: 1, createdAt: 1 })
rateLimitEventSchema.index({ ip: 1, createdAt: 1 })
// TTL matches the longest window a caller checks against (see server/lib/rateLimit.ts)
// so nothing needs a separate cleanup job.
rateLimitEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 })

export const RateLimitEvent =
	mongoose.models.RateLimitEvent || mongoose.model<RateLimitEventDocument>('RateLimitEvent', rateLimitEventSchema)
