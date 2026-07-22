import { Card, Text } from '@mantine/core'
import React from 'react'
import { Link } from 'react-router'

export interface MovieCardProps {
	id: number
	title: string
	posterUrl: string | null
	releaseYear: string | null
}

// Deliberately typed on a minimal shape (not features/movies' MovieSummary)
// so this stays reusable without ui/ importing from features/ — see
// client/src/ui/README.md.
export default function MovieCard({ id, title, posterUrl, releaseYear }: MovieCardProps) {
	return (
		<Card component={Link} to={`/movies/${id}`} withBorder padding="sm" radius="md">
			<Card.Section>
				{posterUrl ? (
					<img src={posterUrl} alt={title} style={{ width: '100%', aspectRatio: '2 / 3', objectFit: 'cover' }} />
				) : (
					<div
						style={{
							width: '100%',
							aspectRatio: '2 / 3',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background: 'var(--mantine-color-gray-2)'
						}}
					>
						<Text size="sm" c="dimmed">No poster</Text>
					</div>
				)}
			</Card.Section>
			<Text fw={500} mt="sm" lineClamp={2}>
				{title}
			</Text>
			{releaseYear ? (
				<Text size="sm" c="dimmed">
					{releaseYear}
				</Text>
			) : null}
		</Card>
	)
}
