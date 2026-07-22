import { getAuthenticatedUserId } from '../session'
import { createSignedSessionCookieValue } from '../test-support/session'

describe('getAuthenticatedUserId', () => {
	test('returns null when there is no cookie', () => {
		expect(getAuthenticatedUserId(undefined)).toBeNull()
	})

	test('returns null for a value with no signature separator', () => {
		expect(getAuthenticatedUserId('not-a-signed-cookie')).toBeNull()
	})

	test('returns null when the signature has been tampered with', () => {
		const value = createSignedSessionCookieValue({ userId: '507f1f77bcf86cd799439011', username: 'critic7' })

		expect(getAuthenticatedUserId(`${value}tampered`)).toBeNull()
	})

	test('returns null when the payload was re-signed with a different secret', () => {
		// Same shape a forged cookie would take: valid base64 JSON, but signed
		// with a secret the server never issued sessions with.
		const forged = 'eyJ1c2VySWQiOiJhdHRhY2tlciJ9.not-a-real-signature'

		expect(getAuthenticatedUserId(forged)).toBeNull()
	})

	test('returns the userId for a correctly signed cookie', () => {
		const value = createSignedSessionCookieValue({ userId: '507f1f77bcf86cd799439011', username: 'critic7' })

		expect(getAuthenticatedUserId(value)).toBe('507f1f77bcf86cd799439011')
	})

	test('returns null when the signed payload has no userId', () => {
		const value = createSignedSessionCookieValue({ username: 'critic7' })

		expect(getAuthenticatedUserId(value)).toBeNull()
	})
})
