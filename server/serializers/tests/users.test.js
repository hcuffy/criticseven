import { toUserPublicDTO } from '../users'

const user = {
	username: 'critic7',
	email: 'critic7@example.com',
	honestyScore: 45,
	isPhoneVerified: true,
	phoneNumberHash: 'salt:hash'
}

describe('user serializer allowlist', () => {
	test('public DTO drops email and phoneNumberHash', () => {
		const dto = toUserPublicDTO(user)

		expect(Object.keys(dto).sort()).toEqual(['honestyScore', 'isLowTrust', 'isPhoneVerified', 'username'])
		expect(dto).not.toHaveProperty('email')
		expect(dto).not.toHaveProperty('phoneNumberHash')
	})

	test('isLowTrust flips opposite isPhoneVerified pattern: low score -> true', () => {
		const lowTrustUser = { ...user, honestyScore: 10 }

		expect(toUserPublicDTO(lowTrustUser).isLowTrust).toBe(true)
		expect(toUserPublicDTO(user).isLowTrust).toBe(false)
	})
})
