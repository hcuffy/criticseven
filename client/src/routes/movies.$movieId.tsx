import React from 'react'
import { redirect } from 'react-router'
import MovieDetail from '../features/movies/movie-detail'
import type { MovieDetails, MovieVideos, OpinionSummary, PaginatedList, ReviewSummary } from '../features/movies/types'
import { getSession, requireSession } from '../session.server'
import type { Route } from './+types/movies.$movieId'

const API_URL = process.env.API_URL ?? 'http://localhost:5000'

const EMPTY_LIST = { page: 1, totalPages: 1, totalResults: 0, results: [] }

const REVIEW_CRITERIA = ['plot', 'acting', 'writing', 'score', 'directing', 'editing', 'cinematography'] as const

interface MovieDetailLoaderData {
	movie: MovieDetails
	videos: MovieVideos
	opinions: PaginatedList<OpinionSummary>
	reviews: PaginatedList<ReviewSummary>
	isAuthenticated: boolean
	currentUsername: string | null
}

interface SubmissionResult {
	intent: 'opinion' | 'review' | 'vote' | 'unvote'
	error: string
}

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData) {
		return [{ title: 'Movie not found — criticseven' }]
	}

	return [
		{ title: `${loaderData.movie.title} — criticseven` },
		{ name: 'description', content: loaderData.movie.overview }
	]
}

export async function loader({ request, params }: Route.LoaderArgs): Promise<MovieDetailLoaderData> {
	// Forwarded the same way the mutation actions below already do — without
	// it, Express never sees the viewer's session on these GET requests, so
	// viewerVote comes back null even for a logged-in viewer who has voted
	// (the vote buttons would never render as active).
	const cookie = request.headers.get('Cookie') ?? ''

	const [movieResponse, videosResponse, opinionsResponse, reviewsResponse, session] = await Promise.all([
		fetch(`${API_URL}/movies/details?movieId=${params.movieId}`),
		fetch(`${API_URL}/movies/videos?movieId=${params.movieId}`),
		fetch(`${API_URL}/movies/${params.movieId}/opinions`, { headers: { Cookie: cookie } }),
		fetch(`${API_URL}/movies/${params.movieId}/reviews`, { headers: { Cookie: cookie } }),
		getSession(request)
	])

	if (!movieResponse.ok) {
		throw new Response('Movie not found', { status: movieResponse.status === 404 ? 404 : 502 })
	}

	const movie = (await movieResponse.json()) as MovieDetails
	// A missing/broken videos response degrades to "no trailer" rather than
	// failing the whole page — the movie's own details are the page's reason
	// to exist, the trailer is a bonus. Opinions/reviews degrade the same way.
	const videos = videosResponse.ok ? ((await videosResponse.json()) as MovieVideos) : { id: movie.id, results: [] }
	const opinions = opinionsResponse.ok
		? ((await opinionsResponse.json()) as PaginatedList<OpinionSummary>)
		: EMPTY_LIST
	const reviews = reviewsResponse.ok ? ((await reviewsResponse.json()) as PaginatedList<ReviewSummary>) : EMPTY_LIST

	return {
		movie,
		videos,
		opinions,
		reviews,
		isAuthenticated: Boolean(session.get('userId')),
		currentUsername: session.get('username') ?? null
	}
}

// requireSession is a fast local fail: no network round trip for an
// obviously logged-out submission, and it throws the documented 401
// Response the route's error boundary already handles (the opinion/review
// forms only render for authenticated users, so reaching this without a
// session means the request bypassed the UI gate). It is NOT the security
// boundary though — Express independently re-verifies the same signed
// `__session` cookie (server/session.ts) before writing anything, since
// Express is reachable directly over the network and can't trust whatever
// this action forwards. The Cookie header is forwarded as-is (not a userId
// pulled out of the session) so Express does its own verification rather
// than trusting this process's read of it.
export async function action({ request, params }: Route.ActionArgs): Promise<Response> {
	await requireSession(request)
	const formData = await request.formData()
	const intent = formData.get('intent')
	const movieId = Number(params.movieId)
	const comment = String(formData.get('comment') ?? '')
	const cookie = request.headers.get('Cookie') ?? ''

	if (intent === 'opinion') {
		const upstream = await fetch(`${API_URL}/opinions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: cookie },
			body: JSON.stringify({ movieId, hypeLevel: Number(formData.get('hypeLevel')), comment })
		})

		if (!upstream.ok) {
			const body = (await upstream.json()) as { error: { message: string } }

			return Response.json({ intent: 'opinion', error: body.error.message } satisfies SubmissionResult, {
				status: upstream.status
			})
		}

		return redirect(request.url)
	}

	if (intent === 'review') {
		const scores = Object.fromEntries(
			REVIEW_CRITERIA.map(criterion => [criterion, Number(formData.get(criterion))])
		)

		const upstream = await fetch(`${API_URL}/reviews`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: cookie },
			body: JSON.stringify({ movieId, comment, ...scores })
		})

		if (!upstream.ok) {
			const body = (await upstream.json()) as { error: { message: string } }

			return Response.json({ intent: 'review', error: body.error.message } satisfies SubmissionResult, {
				status: upstream.status
			})
		}

		return redirect(request.url)
	}

	if (intent === 'vote') {
		// Fetcher-driven (client/src/ui/vote-buttons.tsx), not a full-page
		// <Form> submission — no redirect() here, the fetcher revalidates the
		// loader itself once this resolves.
		const upstream = await fetch(`${API_URL}/votes`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Cookie: cookie },
			body: JSON.stringify({
				targetType: formData.get('targetType'),
				targetId: formData.get('targetId'),
				voteValue: Number(formData.get('voteValue'))
			})
		})

		if (!upstream.ok) {
			const body = (await upstream.json()) as { error: { message: string } }

			return Response.json({ intent: 'vote', error: body.error.message } satisfies SubmissionResult, {
				status: upstream.status
			})
		}

		return Response.json({ intent: 'vote', error: '' } satisfies SubmissionResult, { status: 200 })
	}

	if (intent === 'unvote') {
		// Standard toggle-off: tapping the already-active vote button removes
		// it instead of re-submitting the same value (client/src/ui/vote-buttons.tsx).
		const upstream = await fetch(`${API_URL}/votes`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json', Cookie: cookie },
			body: JSON.stringify({
				targetType: formData.get('targetType'),
				targetId: formData.get('targetId')
			})
		})

		if (!upstream.ok) {
			const body = (await upstream.json()) as { error: { message: string } }

			return Response.json({ intent: 'unvote', error: body.error.message } satisfies SubmissionResult, {
				status: upstream.status
			})
		}

		return Response.json({ intent: 'unvote', error: '' } satisfies SubmissionResult, { status: 200 })
	}

	throw new Response('Unknown form submission', { status: 400 })
}

export default function MovieDetailRoute({ loaderData }: Route.ComponentProps) {
	return (
		<MovieDetail
			movie={loaderData.movie}
			videos={loaderData.videos}
			opinions={loaderData.opinions}
			reviews={loaderData.reviews}
			isAuthenticated={loaderData.isAuthenticated}
			currentUsername={loaderData.currentUsername}
		/>
	)
}
