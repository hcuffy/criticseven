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
	// 50 (neutral midpoint) not 0 — a brand-new user with no HonestyLog
	// history hasn't done anything dishonest yet, so they shouldn't start
	// out already below the low-trust badge threshold.
	honestyScore: { type: Number, default: 50 },
	isPhoneVerified: { type: Boolean, default: false },
	phoneNumberHash: { type: String, default: null },
	createdAt: { type: Date, default: Date.now }
})

export const User = mongoose.models.User || mongoose.model<UserDocument>('User', userSchema)
