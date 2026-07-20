import { UserDocument } from '../database/models/User'

export interface UserPublicDTO {
	username: string
	honestyScore: number
	isLowTrust: boolean
	isPhoneVerified: boolean
}

// Placeholder until the Config model (docs/plan) exists — mirrors its
// planned lowTrustBadgeThreshold default of 30.
const LOW_TRUST_THRESHOLD = 30

export function toUserPublicDTO(user: UserDocument): UserPublicDTO {
	return {
		username: user.username,
		honestyScore: user.honestyScore,
		isLowTrust: user.honestyScore < LOW_TRUST_THRESHOLD,
		isPhoneVerified: user.isPhoneVerified
	}
}
