import React from 'react'
import Movies from '../features/movies/movies'
import type { MovieList } from '../features/movies/types'
import type { Route } from './+types/movies'

const API_URL = process.env.API_URL ?? 'http://localhost:5000'

export async function loader(): Promise<MovieList> {
  const response = await fetch(`${API_URL}/movies/popular`)

  if (!response.ok) {
    throw new Response('Failed to load movies', { status: 502 })
  }

  return response.json()
}

export default function MoviesRoute({ loaderData }: Route.ComponentProps) {
  return <Movies moviesData={loaderData} />
}
