import mongoose from 'mongoose'
import { ImageCache } from '../database/models/image-cache'

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original'

function buildTmdbDirectUrl(tmdbImagePath: string): string {
	return `${TMDB_IMAGE_BASE_URL}${tmdbImagePath}`
}

// The Cloudflare API token travels only in a request header, never
// interpolated into a URL or error string (unlike the TMDB api_key, which is
// a query param and needed the redaction fix in the error handler) — so
// there is nothing here for a thrown error or log line to leak.
async function uploadImageFromUrl(accountId: string, apiToken: string, sourceUrl: string): Promise<string | null> {
	const body = new FormData()

	body.set('url', sourceUrl)

	const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${apiToken}` },
		body
	})

	if (!response.ok) {
		return null
	}

	const payload = (await response.json()) as { success: boolean; result?: { variants?: string[] } }

	if (!payload.success) {
		return null
	}

	return payload.result?.variants?.[0] ?? null
}

/*
 * Thin swappable-provider abstraction (docs/plan Phase 4): callers ask for a
 * poster/backdrop URL and get one back, never touching Cloudflare or TMDB
 * directly. Every early-exit below falls back to the raw TMDB CDN URL rather
 * than throwing, so a missing config, a down Cloudflare API, or a
 * disconnected database degrades to "works like before this PR" instead of
 * a broken image or a 500.
 */
export async function getPosterUrl(tmdbImagePath: string | null): Promise<string | null> {
	if (!tmdbImagePath) {
		return null
	}

	const directUrl = buildTmdbDirectUrl(tmdbImagePath)

	if (mongoose.connection.readyState !== 1) {
		return directUrl
	}

	const cached = await ImageCache.findOne({ tmdbImagePath })

	if (cached) {
		return cached.cloudflareImageUrl
	}

	const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
	const apiToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN

	if (!accountId || !apiToken) {
		return directUrl
	}

	try {
		const cloudflareImageUrl = await uploadImageFromUrl(accountId, apiToken, directUrl)

		if (!cloudflareImageUrl) {
			return directUrl
		}

		// $setOnInsert, not a plain upsert-with-new-value: two concurrent
		// misses for the same path can both reach here and both upload, but
		// only the first write should win the cache row, so every later
		// reader converges on the same URL rather than flip-flopping.
		const cacheEntry = await ImageCache.findOneAndUpdate(
			{ tmdbImagePath },
			{ $setOnInsert: { tmdbImagePath, cloudflareImageUrl } },
			{ upsert: true, new: true }
		)

		return cacheEntry.cloudflareImageUrl
	} catch (error) {
		console.error('Cloudflare Images upload failed, falling back to TMDB URL:', (error as Error).message)
		return directUrl
	}
}

// Posters and backdrops are both just images to Cloudflare — same upload,
// same cache, same fallback. Kept as a named alias so call sites read
// clearly rather than because the mechanics differ.
export const getBackdropUrl = getPosterUrl
