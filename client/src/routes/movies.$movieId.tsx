import React from 'react'
import MovieDetail from '../features/movies/movie-detail'
import type { MovieDetails, MovieVideos } from '../features/movies/types'
import type { Route } from './+types/movies.$movieId'

const API_URL = process.env.API_URL ?? 'http://localhost:5000'

interface MovieDetailLoaderData {
	movie: MovieDetails
	videos: MovieVideos
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

export async function loader({ params }: Route.LoaderArgs): Promise<MovieDetailLoaderData> {
	const [movieResponse, videosResponse] = await Promise.all([
		fetch(`${API_URL}/movies/details?movieId=${params.movieId}`),
		fetch(`${API_URL}/movies/videos?movieId=${params.movieId}`)
	])

	if (!movieResponse.ok) {
		throw new Response('Movie not found', { status: movieResponse.status === 404 ? 404 : 502 })
	}

	const movie = (await movieResponse.json()) as MovieDetails
	// A missing/broken videos response degrades to "no trailer" rather than
	// failing the whole page — the movie's own details are the page's reason
	// to exist, the trailer is a bonus.
	const videos = videosResponse.ok ? ((await videosResponse.json()) as MovieVideos) : { id: movie.id, results: [] }

	return { movie, videos }
}

export default function MovieDetailRoute({ loaderData }: Route.ComponentProps) {
	return <MovieDetail movie={loaderData.movie} videos={loaderData.videos} />
}
