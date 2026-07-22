import { Container, SimpleGrid, Title } from '@mantine/core'
import React from 'react'
import MovieCard from '../../ui/movie-card'
import type { MovieList } from './types'

function releaseYear(releaseDate: string): string | null {
	return releaseDate ? releaseDate.slice(0, 4) : null
}

function MovieGrid({ movieList }: { movieList: MovieList }) {
	return (
		<SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
			{movieList.results.map(movie => (
				<MovieCard
					key={movie.id}
					id={movie.id}
					title={movie.title}
					posterUrl={movie.poster_path}
					releaseYear={releaseYear(movie.release_date)}
				/>
			))}
		</SimpleGrid>
	)
}

export default function Movies({ popular, upcoming }: { popular: MovieList; upcoming: MovieList }) {
	return (
		<Container size="xl" py="lg">
			<Title order={2} mb="md">Popular</Title>
			<MovieGrid movieList={popular} />

			<Title order={2} mt="xl" mb="md">Upcoming</Title>
			<MovieGrid movieList={upcoming} />
		</Container>
	)
}
