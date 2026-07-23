import { Badge, Stack, Text } from '@mantine/core'
import React from 'react'
import MovieCard from './movie-card'

export interface ProfileActivityCardProps {
	movie: { id: number; title: string; posterUrl: string | null; releaseYear: string | null }
	kind: 'review' | 'opinion'
	score: number | null
	hypeLevel: number | null
	comment: string
}

// Deliberately typed on a minimal inline shape (not features/users' types),
// same discipline client/src/ui/movie-card.tsx already follows, so this
// stays ui/-safe. Composes the existing MovieCard rather than duplicating
// its poster-tile layout.
export default function ProfileActivityCard({ movie, kind, score, hypeLevel, comment }: ProfileActivityCardProps) {
	return (
		<Stack gap={4}>
			<MovieCard id={movie.id} title={movie.title} posterUrl={movie.posterUrl} releaseYear={movie.releaseYear} />
			<Badge variant="light" color={kind === 'review' ? 'teal' : 'orange'} size="sm">
				{kind === 'review' ? `Score ${score}/10` : `Hype ${hypeLevel}/5`}
			</Badge>
			{comment ? <Text size="xs" c="dimmed" lineClamp={2}>{comment}</Text> : null}
		</Stack>
	)
}
