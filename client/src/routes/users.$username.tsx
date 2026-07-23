import React from 'react'
import UserProfilePage from '../features/users/user-profile'
import type { ActivityMovie, OpinionActivityItem, PaginatedList, ReviewActivityItem, UserProfile } from '../features/users/types'
import { getSession } from '../session.server'
import type { Route } from './+types/users.$username'

const API_URL = process.env.API_URL ?? 'http://localhost:5000'

const EMPTY_LIST = { page: 1, totalPages: 1, totalResults: 0, results: [] }

interface RawMovieDetailsDTO {
	id: number
	title: string
	poster_path: string | null
	release_date: string
}

interface UserProfileLoaderData {
	profile: UserProfile
	reviews: PaginatedList<ReviewActivityItem>
	opinions: PaginatedList<OpinionActivityItem>
	movieById: Record<number, ActivityMovie>
	isOwnProfile: boolean
}

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData) {
		return [{ title: 'User not found — criticseven' }]
	}

	return [{ title: `${loaderData.profile.username} — criticseven` }]
}

export async function loader({ request, params }: Route.LoaderArgs): Promise<UserProfileLoaderData> {
	// Same cookie-forwarding rule as the movie-detail loader: without it,
	// viewerVote-equivalent personalization (here, isOwnProfile) can't be
	// computed, and Express never sees the viewer's session on these GETs.
	const cookie = request.headers.get('Cookie') ?? ''

	const [profileResponse, reviewsResponse, opinionsResponse, session] = await Promise.all([
		fetch(`${API_URL}/users/${params.username}`),
		fetch(`${API_URL}/users/${params.username}/reviews`, { headers: { Cookie: cookie } }),
		fetch(`${API_URL}/users/${params.username}/opinions`, { headers: { Cookie: cookie } }),
		getSession(request)
	])

	if (!profileResponse.ok) {
		throw new Response('User not found', { status: profileResponse.status === 404 ? 404 : 502 })
	}

	const profile = (await profileResponse.json()) as UserProfile
	const reviews = reviewsResponse.ok
		? ((await reviewsResponse.json()) as PaginatedList<ReviewActivityItem>)
		: EMPTY_LIST
	const opinions = opinionsResponse.ok
		? ((await opinionsResponse.json()) as PaginatedList<OpinionActivityItem>)
		: EMPTY_LIST

	// Neither Review nor TrailerOpinion stores a denormalized movie
	// title/poster, so the profile's activity cards need a second, batched
	// round trip per distinct movieId — same TMDB-details endpoint the
	// movie-detail loader already uses, just parallelized across the set.
	const movieIds = Array.from(new Set([
		...reviews.results.map(review => review.movieId),
		...opinions.results.map(opinion => opinion.movieId)
	]))

	const movieDetailsResponses = await Promise.all(
		movieIds.map(movieId => fetch(`${API_URL}/movies/details?movieId=${movieId}`))
	)
	const movieDetails = await Promise.all(
		movieDetailsResponses.map(response => (response.ok ? (response.json() as Promise<RawMovieDetailsDTO>) : null))
	)

	const movieById: Record<number, ActivityMovie> = {}

	movieIds.forEach((movieId, index) => {
		const details = movieDetails[index]

		if (details) {
			movieById[movieId] = {
				id: details.id,
				title: details.title,
				posterUrl: details.poster_path,
				releaseYear: details.release_date ? details.release_date.slice(0, 4) : null
			}
		}
	})

	return {
		profile,
		reviews,
		opinions,
		movieById,
		isOwnProfile: session.get('username') === params.username
	}
}

export default function UserProfileRoute({ loaderData }: Route.ComponentProps) {
	return (
		<UserProfilePage
			profile={loaderData.profile}
			reviews={loaderData.reviews}
			opinions={loaderData.opinions}
			movieById={loaderData.movieById}
			isOwnProfile={loaderData.isOwnProfile}
		/>
	)
}
