import { DEFAULT_LOW_TRUST_BADGE_THRESHOLD } from '../database/models/config'
import { UserDocument } from '../database/models/User'

export interface UserPublicDTO {
	username: string
	honestyScore: number
	isLowTrust: boolean
	isPhoneVerified: boolean
}

// Threshold defaults to Config's default rather than reading Config here —
// DTOs stay synchronous and DB-free; callers that already have the live
// Config document (it's a single cached lookup) pass its value in.
export function toUserPublicDTO(
	user: UserDocument,
	lowTrustBadgeThreshold: number = DEFAULT_LOW_TRUST_BADGE_THRESHOLD
): UserPublicDTO {
	return {
		username: user.username,
		honestyScore: user.honestyScore,
		isLowTrust: user.honestyScore < lowTrustBadgeThreshold,
		isPhoneVerified: user.isPhoneVerified
	}
}
