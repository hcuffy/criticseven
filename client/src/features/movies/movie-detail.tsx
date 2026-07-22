import { Badge, Container, Grid, Group, Text, Title } from '@mantine/core'
import React from 'react'
import type { MovieDetails, MovieVideos } from './types'

function findTrailer(videos: MovieVideos) {
  return (
    videos.results.find(video => video.site === 'YouTube' && video.type === 'Trailer' && video.official) ??
    videos.results.find(video => video.site === 'YouTube' && video.type === 'Trailer') ??
    null
  )
}

export default function MovieDetail({ movie, videos }: { movie: MovieDetails; videos: MovieVideos }) {
  const trailer = findTrailer(videos)
  const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : null

  return (
    <Container size="lg" py="lg">
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          {movie.poster_path ? (
            <img
              src={movie.poster_path}
              alt={movie.title}
              style={{ width: '100%', borderRadius: 'var(--mantine-radius-md)' }}
            />
          ) : null}
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 8 }}>
          <Title order={1}>{movie.title}</Title>

          <Group gap="xs" mt="xs">
            {releaseYear ? <Text c="dimmed">{releaseYear}</Text> : null}
            {movie.runtime ? <Text c="dimmed">{movie.runtime} min</Text> : null}
            <Badge variant="light">{movie.vote_average.toFixed(1)} / 10</Badge>
          </Group>

          {movie.tagline ? (
            <Text fs="italic" c="dimmed" mt="sm">{movie.tagline}</Text>
          ) : null}

          <Group gap="xs" mt="sm">
            {movie.genres.map(genre => (
              <Badge key={genre.id} variant="outline">{genre.name}</Badge>
            ))}
          </Group>

          <Text mt="md">{movie.overview}</Text>

          {trailer ? (
            <div style={{ marginTop: 'var(--mantine-spacing-lg)' }}>
              <Title order={3} mb="sm">Trailer</Title>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  title={trailer.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                />
              </div>
            </div>
          ) : null}
        </Grid.Col>
      </Grid>
    </Container>
  )
}
