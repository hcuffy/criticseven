import mongoose, { Schema } from 'mongoose'

export interface UserDocument extends mongoose.Document {
	username: string
	email: string
	honestyScore: number
	// Set once a later phone-verification flow (SMS send/verify) completes.
	// Not built yet — this only reserves the field so the schema doesn't
	// need a migration when that phase lands.
	isPhoneVerified: boolean
	// Hashed via server/lib/hash.ts — raw phone numbers are never stored,
	// per the data-minimization gate (see server/serializers/README.md).
	phoneNumberHash: string | null
	createdAt: Date
}

const userSchema = new Schema<UserDocument>({
	username: { type: String, required: true, unique: true },
	email: { type: String, required: true, unique: true },
	honestyScore: { type: Number, default: 0 },
	isPhoneVerified: { type: Boolean, default: false },
	phoneNumberHash: { type: String, default: null },
	createdAt: { type: Date, default: Date.now }
})

export const User = mongoose.models.User || mongoose.model<UserDocument>('User', userSchema)
