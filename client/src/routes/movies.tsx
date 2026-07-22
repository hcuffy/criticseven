import React from 'react'
import Movies from '../features/movies/movies'
import type { MovieList } from '../features/movies/types'
import type { Route } from './+types/movies'

const API_URL = process.env.API_URL ?? 'http://localhost:5000'

interface MoviesLoaderData {
  popular: MovieList
  upcoming: MovieList
}

export function meta() {
  return [
    { title: 'Movies — criticseven' },
    { name: 'description', content: 'Popular and upcoming movies.' }
  ]
}

export async function loader(): Promise<MoviesLoaderData> {
  const [popularResponse, upcomingResponse] = await Promise.all([
    fetch(`${API_URL}/movies/popular`),
    fetch(`${API_URL}/movies/upcoming`)
  ])

  if (!popularResponse.ok || !upcomingResponse.ok) {
    throw new Response('Failed to load movies', { status: 502 })
  }

  const [popular, upcoming] = await Promise.all([popularResponse.json(), upcomingResponse.json()])

  return { popular, upcoming }
}

export default function MoviesRoute({ loaderData }: Route.ComponentProps) {
  return <Movies popular={loaderData.popular} upcoming={loaderData.upcoming} />
}
