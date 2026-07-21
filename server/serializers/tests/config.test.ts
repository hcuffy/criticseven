import { toConfigPublicDTO } from '../config'

const config = {
	id: '507f1f77bcf86cd799439015',
	singletonKey: 'singleton',
	lowTrustBadgeThreshold: 30,
	voteWeightFloor: 0.2
}

describe('config serializer allowlist', () => {
	test('public DTO exposes only the two public thresholds', () => {
		const dto = toConfigPublicDTO(config as never)

		expect(Object.keys(dto).sort()).toEqual(['lowTrustBadgeThreshold', 'voteWeightFloor'])
		expect(dto).not.toHaveProperty('singletonKey')
		expect(dto).not.toHaveProperty('id')
	})
})
