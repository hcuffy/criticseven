import { ImageCache } from '../../database/models/image-cache'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../test-support/database'
import { getPosterUrl } from '../image-service'

const TMDB_DIRECT_URL = 'https://image.tmdb.org/t/p/original/poster.jpg'
const CLOUDFLARE_URL = 'https://imagedelivery.net/account-hash/image-id/public'

function mockCloudflareUpload(overrides: Partial<{ ok: boolean; success: boolean; variants: string[] }> = {}) {
	const ok = overrides.ok ?? true
	const success = overrides.success ?? true
	const variants = overrides.variants ?? [CLOUDFLARE_URL]

	return jest.spyOn(global, 'fetch').mockResolvedValue({
		ok,
		json: async() => ({ success, result: { variants } })
	} as Response)
}

beforeAll(async() => {
	await connectTestDatabase()
	await ImageCache.init()
})

afterAll(async() => {
	await disconnectTestDatabase()
})

afterEach(async() => {
	await clearTestDatabase()
	jest.restoreAllMocks()
	delete process.env.CLOUDFLARE_ACCOUNT_ID
	delete process.env.CLOUDFLARE_IMAGES_API_TOKEN
})

describe('getPosterUrl', () => {
	test('null path returns null without any network call', async() => {
		const fetchSpy = jest.spyOn(global, 'fetch')

		expect(await getPosterUrl(null)).toBeNull()
		expect(fetchSpy).not.toHaveBeenCalled()
	})

	test('not configured (no Cloudflare credentials) falls back to the direct TMDB URL', async() => {
		const fetchSpy = jest.spyOn(global, 'fetch')

		const url = await getPosterUrl('/poster.jpg')

		expect(url).toBe(TMDB_DIRECT_URL)
		expect(fetchSpy).not.toHaveBeenCalled()
	})

	test('cache miss: uploads through Cloudflare and persists the mapping', async() => {
		process.env.CLOUDFLARE_ACCOUNT_ID = 'account-id'
		process.env.CLOUDFLARE_IMAGES_API_TOKEN = 'super-secret-token'
		const fetchSpy = mockCloudflareUpload()

		const url = await getPosterUrl('/poster.jpg')

		expect(url).toBe(CLOUDFLARE_URL)
		expect(fetchSpy).toHaveBeenCalledTimes(1)

		const cached = await ImageCache.findOne({ tmdbImagePath: '/poster.jpg' })

		expect(cached?.cloudflareImageUrl).toBe(CLOUDFLARE_URL)
	})

	test('cache hit: a second call for the same path does not re-upload', async() => {
		process.env.CLOUDFLARE_ACCOUNT_ID = 'account-id'
		process.env.CLOUDFLARE_IMAGES_API_TOKEN = 'super-secret-token'
		const fetchSpy = mockCloudflareUpload()

		const first = await getPosterUrl('/poster.jpg')
		const second = await getPosterUrl('/poster.jpg')

		expect(first).toBe(CLOUDFLARE_URL)
		expect(second).toBe(CLOUDFLARE_URL)
		expect(fetchSpy).toHaveBeenCalledTimes(1)
	})

	test('Cloudflare returning a non-ok response falls back to the direct TMDB URL, not a throw', async() => {
		process.env.CLOUDFLARE_ACCOUNT_ID = 'account-id'
		process.env.CLOUDFLARE_IMAGES_API_TOKEN = 'super-secret-token'
		mockCloudflareUpload({ ok: false })

		const url = await getPosterUrl('/poster.jpg')

		expect(url).toBe(TMDB_DIRECT_URL)
		expect(await ImageCache.findOne({ tmdbImagePath: '/poster.jpg' })).toBeNull()
	})

	test('Cloudflare API being down (network error) falls back to the direct TMDB URL, not a throw', async() => {
		process.env.CLOUDFLARE_ACCOUNT_ID = 'account-id'
		process.env.CLOUDFLARE_IMAGES_API_TOKEN = 'super-secret-token'
		jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network unreachable'))

		await expect(getPosterUrl('/poster.jpg')).resolves.toBe(TMDB_DIRECT_URL)
	})

	test('a failed upload never logs or returns the API token', async() => {
		process.env.CLOUDFLARE_ACCOUNT_ID = 'account-id'
		process.env.CLOUDFLARE_IMAGES_API_TOKEN = 'super-secret-token'
		jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network unreachable'))
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

		const url = await getPosterUrl('/poster.jpg')

		expect(url).not.toContain('super-secret-token')
		for (const call of consoleErrorSpy.mock.calls) {
			for (const argument of call) {
				expect(String(argument)).not.toContain('super-secret-token')
			}
		}
	})
})
