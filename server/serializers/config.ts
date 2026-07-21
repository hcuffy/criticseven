import { ConfigDocument } from '../database/models/config'

export interface ConfigPublicDTO {
	lowTrustBadgeThreshold: number
	voteWeightFloor: number
}

export function toConfigPublicDTO(config: ConfigDocument): ConfigPublicDTO {
	return {
		lowTrustBadgeThreshold: config.lowTrustBadgeThreshold,
		voteWeightFloor: config.voteWeightFloor
	}
}
