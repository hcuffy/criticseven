import { Badge, Button, Card, Group, SimpleGrid, Stack, Text, Textarea, Title } from '@mantine/core'
import React from 'react'
import { Form, Link, useActionData, useNavigation } from 'react-router'
import LowTrustBadge from '../../ui/low-trust-badge'
import RatingInput from '../../ui/rating-input'
import VoteButtons from '../../ui/vote-buttons'
import type { PaginatedList, ReviewSummary } from './types'

interface SubmissionResult {
  intent: 'opinion' | 'review'
  error: string
}

const CRITERIA: Array<{ name: keyof Omit<ReviewSummary, 'id' | 'movieId' | 'author' | 'comment' | 'createdAt'>; label: string }> = [
  { name: 'plot', label: 'Plot' },
  { name: 'acting', label: 'Acting' },
  { name: 'writing', label: 'Writing' },
  { name: 'score', label: 'Overall score' },
  { name: 'directing', label: 'Directing' },
  { name: 'editing', label: 'Editing' },
  { name: 'cinematography', label: 'Cinematography' }
]

function ReviewForm() {
  const actionData = useActionData() as SubmissionResult | undefined
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting' && navigation.formData?.get('intent') === 'review'
  const error = actionData?.intent === 'review' ? actionData.error : undefined

  return (
    <Form method="post">
      <input type="hidden" name="intent" value="review" />
      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {CRITERIA.map(criterion => (
            <RatingInput key={criterion.name} name={criterion.name} label={criterion.label} min={1} max={10} />
          ))}
        </SimpleGrid>
        <Textarea name="comment" label="Comment" placeholder="What did you think, now that you've seen it?" autosize minRows={3} />
        {error ? <Text c="red" size="sm">{error}</Text> : null}
        <Button type="submit" loading={isSubmitting} style={{ alignSelf: 'flex-start' }}>
          Submit review
        </Button>
      </Stack>
    </Form>
  )
}

function ReviewList(
  { reviews, isAuthenticated, currentUsername }: {
    reviews: ReviewSummary[]
    isAuthenticated: boolean
    currentUsername: string | null
  }
) {
  if (reviews.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No reviews yet — be the first to review it after watching.
      </Text>
    )
  }

  return (
    <Stack gap="sm">
      {reviews.map(review => (
        <Card key={review.id} withBorder padding="sm" radius="md">
          <Group gap="xs" justify="space-between">
            <Group gap="xs">
              <Text fw={500}>{review.author.username}</Text>
              {review.author.isLowTrust ? <LowTrustBadge /> : null}
              <Text size="sm" c="dimmed">Honesty {review.author.honestyScore}</Text>
              <Badge variant="light" color="teal">Score {review.score}/10</Badge>
            </Group>
            {review.author.username === currentUsername ? null : (
              <VoteButtons
                targetType="review"
                targetId={review.id}
                netVoteCount={review.netVoteCount}
                viewerVote={review.viewerVote}
                isAuthenticated={isAuthenticated}
              />
            )}
          </Group>
          <Group gap="xs" mt="xs">
            {CRITERIA.filter(criterion => criterion.name !== 'score').map(criterion => (
              <Badge key={criterion.name} variant="outline" size="sm">
                {criterion.label} {review[criterion.name]}/10
              </Badge>
            ))}
          </Group>
          {review.comment ? <Text size="sm" mt="xs">{review.comment}</Text> : null}
        </Card>
      ))}
    </Stack>
  )
}

export default function ReviewSection(
  { reviews, isAuthenticated, currentUsername }: {
    reviews: PaginatedList<ReviewSummary>
    isAuthenticated: boolean
    currentUsername: string | null
  }
) {
  return (
    <Stack gap="md" mt="xl">
      <Group gap="xs">
        <Title order={2}>Reviews</Title>
        <Badge color="teal" variant="filled">Seen</Badge>
      </Group>
      <Text c="dimmed" size="sm">Reviews from people who&apos;ve actually watched the movie.</Text>

      {isAuthenticated ? (
        <ReviewForm />
      ) : (
        <Text size="sm">
          <Link to="/login">Log in</Link> to write your own review.
        </Text>
      )}

      <ReviewList reviews={reviews.results} isAuthenticated={isAuthenticated} currentUsername={currentUsername} />
    </Stack>
  )
}
