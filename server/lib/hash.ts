import crypto from 'crypto'

/*
 * Shared one-way hashing for values that must never be stored or logged raw
 * (auth codes, phone numbers). Uses scrypt with a per-value random salt plus
 * a server-side pepper so a DB leak alone isn't enough to recover inputs.
 */
const pepper = process.env.HASH_PEPPER || ''

export async function hashValue(value: string): Promise<string> {
	const salt = crypto.randomBytes(16).toString('hex')

	const derivedKey = await new Promise<Buffer>((resolve, reject) => {
		crypto.scrypt(`${value}${pepper}`, salt, 64, (error, key) => {
			if (error) {
				reject(error)
			} else {
				resolve(key)
			}
		})
	})

	return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifyHash(value: string, stored: string): Promise<boolean> {
	const [salt, hash] = stored.split(':')

	if (!salt || !hash) {
		return false
	}

	const derivedKey = await new Promise<Buffer>((resolve, reject) => {
		crypto.scrypt(`${value}${pepper}`, salt, 64, (error, key) => {
			if (error) {
				reject(error)
			} else {
				resolve(key)
			}
		})
	})

	const hashBuffer = Buffer.from(hash, 'hex')

	return hashBuffer.length === derivedKey.length && crypto.timingSafeEqual(hashBuffer, derivedKey)
}
