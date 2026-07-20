import mongoose, { Schema } from 'mongoose'

export interface AuthCodeDocument extends mongoose.Document {
	email: string
	// Never stored raw — see server/lib/hash.ts.
	codeHash: string
	used: boolean
	expiresAt: Date
	createdAt: Date
}

const authCodeSchema = new Schema<AuthCodeDocument>({
	email: { type: String, required: true },
	codeHash: { type: String, required: true },
	used: { type: Boolean, default: false },
	expiresAt: { type: Date, required: true },
	createdAt: { type: Date, default: Date.now }
})

// TTL index: Mongo drops the document itself once expiresAt passes, so
// expired codes don't need a separate cleanup job.
authCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const AuthCode = mongoose.models.AuthCode || mongoose.model<AuthCodeDocument>('AuthCode', authCodeSchema)
