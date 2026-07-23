import { Badge, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import React from 'react'
import ProfileActivityCard from '../../ui/profile-activity-card'
import AccountSettingsShell from './account-settings-shell'
import type { ActivityMovie, OpinionActivityItem, PaginatedList, ReviewActivityItem, UserProfile } from './types'

const UNKNOWN_MOVIE: ActivityMovie = { id: 0, title: 'Unknown movie', posterUrl: null, releaseYear: null }

function formatMemberSince(createdAt: string): string {
	return new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
}

export default function UserProfilePage({
	profile, reviews, opinions, movieById, isOwnProfile
}: {
	profile: UserProfile
	reviews: PaginatedList<ReviewActivityItem>
	opinions: PaginatedList<OpinionActivityItem>
	movieById: Record<number, ActivityMovie>
	isOwnProfile: boolean
}) {
	return (
		<Container size="lg" py="lg">
			<Group gap="xs">
				<Title order={1}>{profile.username}</Title>
				{profile.isLowTrust ? <Badge color="red" variant="light">Low trust</Badge> : null}
				{profile.isPhoneVerified ? <Badge color="blue" variant="light">Verified</Badge> : null}
			</Group>
			<Group gap="md" mt="xs">
				<Text c="dimmed">Honesty score {profile.honestyScore}</Text>
				<Text c="dimmed">Member since {formatMemberSince(profile.createdAt)}</Text>
			</Group>

			{isOwnProfile ? <AccountSettingsShell /> : null}

			<Stack gap="md" mt="xl">
				<Group gap="xs">
					<Title order={2}>Seen</Title>
					<Badge color="teal" variant="filled">Reviews</Badge>
				</Group>
				{reviews.results.length === 0 ? (
					<Text c="dimmed" size="sm">No reviews yet.</Text>
				) : (
					<SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
						{reviews.results.map(review => (
							<ProfileActivityCard
								key={review.id}
								movie={movieById[review.movieId] ?? { ...UNKNOWN_MOVIE, id: review.movieId }}
								kind="review"
								score={review.score}
								hypeLevel={null}
								comment={review.comment}
							/>
						))}
					</SimpleGrid>
				)}
			</Stack>

			<Stack gap="md" mt="xl">
				<Group gap="xs">
					<Title order={2}>Unseen</Title>
					<Badge color="orange" variant="filled">Opinions</Badge>
				</Group>
				{opinions.results.length === 0 ? (
					<Text c="dimmed" size="sm">No opinions yet.</Text>
				) : (
					<SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
						{opinions.results.map(opinion => (
							<ProfileActivityCard
								key={opinion.id}
								movie={movieById[opinion.movieId] ?? { ...UNKNOWN_MOVIE, id: opinion.movieId }}
								kind="opinion"
								score={null}
								hypeLevel={opinion.hypeLevel}
								comment={opinion.comment}
							/>
						))}
					</SimpleGrid>
				)}
			</Stack>
		</Container>
	)
}
