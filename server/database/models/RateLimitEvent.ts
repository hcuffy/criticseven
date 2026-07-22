import mongoose, { Schema } from 'mongoose'

export interface RateLimitEventDocument extends mongoose.Document {
	// Separates budgets per endpoint (e.g. 'request-code', 'verify-code',
	// 'vote') so exhausting one doesn't starve the other for the same user.
	scope: string
	// Auth scopes key on email/ip; the 'vote' scope keys on userId instead
	// (already-authenticated, no email/ip involved) — exactly one of
	// email/ip or userId is populated depending on scope, never all three.
	email: string | null
	ip: string | null
	userId: string | null
	createdAt: Date
}

const rateLimitEventSchema = new Schema<RateLimitEventDocument>({
	scope: { type: String, required: true },
	email: { type: String, default: null },
	ip: { type: String, default: null },
	userId: { type: String, default: null },
	createdAt: { type: Date, default: Date.now }
})

rateLimitEventSchema.index({ scope: 1, email: 1, createdAt: 1 })
rateLimitEventSchema.index({ scope: 1, ip: 1, createdAt: 1 })
rateLimitEventSchema.index({ scope: 1, userId: 1, createdAt: 1 })
// TTL matches the longest window a caller checks against (see server/lib/rateLimit.ts)
// so nothing needs a separate cleanup job.
rateLimitEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 })

export const RateLimitEvent =
	mongoose.models.RateLimitEvent || mongoose.model<RateLimitEventDocument>('RateLimitEvent', rateLimitEventSchema)
