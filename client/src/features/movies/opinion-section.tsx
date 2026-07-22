import { Badge, Button, Card, Group, Stack, Text, Textarea, Title } from '@mantine/core'
import React from 'react'
import { Form, Link, useActionData, useNavigation } from 'react-router'
import LowTrustBadge from '../../ui/low-trust-badge'
import RatingInput from '../../ui/rating-input'
import VoteButtons from '../../ui/vote-buttons'
import type { OpinionSummary, PaginatedList } from './types'

interface SubmissionResult {
  intent: 'opinion' | 'review'
  error: string
}

function OpinionForm() {
  const actionData = useActionData() as SubmissionResult | undefined
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting' && navigation.formData?.get('intent') === 'opinion'
  const error = actionData?.intent === 'opinion' ? actionData.error : undefined

  return (
    <Form method="post">
      <input type="hidden" name="intent" value="opinion" />
      <Stack gap="sm">
        <RatingInput name="hypeLevel" label="Hype level" min={1} max={5} />
        <Textarea name="comment" label="Comment" placeholder="What's got you hyped (or not)?" autosize minRows={2} />
        {error ? <Text c="red" size="sm">{error}</Text> : null}
        <Button type="submit" loading={isSubmitting} style={{ alignSelf: 'flex-start' }}>
          Share opinion
        </Button>
      </Stack>
    </Form>
  )
}

function OpinionList(
  { opinions, isAuthenticated, currentUsername }: {
    opinions: OpinionSummary[]
    isAuthenticated: boolean
    currentUsername: string | null
  }
) {
  if (opinions.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No opinions yet — be the first to share your pre-release take.
      </Text>
    )
  }

  return (
    <Stack gap="sm">
      {opinions.map(opinion => (
        <Card key={opinion.id} withBorder padding="sm" radius="md">
          <Group gap="xs" justify="space-between">
            <Group gap="xs">
              <Text fw={500}>{opinion.author.username}</Text>
              {opinion.author.isLowTrust ? <LowTrustBadge /> : null}
              <Text size="sm" c="dimmed">Honesty {opinion.author.honestyScore}</Text>
              <Badge variant="light" color="orange">Hype {opinion.hypeLevel}/5</Badge>
            </Group>
            {opinion.author.username === currentUsername ? null : (
              <VoteButtons
                targetType="opinion"
                targetId={opinion.id}
                netVoteCount={opinion.netVoteCount}
                viewerVote={opinion.viewerVote}
                isAuthenticated={isAuthenticated}
              />
            )}
          </Group>
          {opinion.comment ? <Text size="sm" mt="xs">{opinion.comment}</Text> : null}
        </Card>
      ))}
    </Stack>
  )
}

export default function OpinionSection(
  { opinions, isAuthenticated, currentUsername }: {
    opinions: PaginatedList<OpinionSummary>
    isAuthenticated: boolean
    currentUsername: string | null
  }
) {
  return (
    <Stack gap="md" mt="xl">
      <Group gap="xs">
        <Title order={2}>Opinions</Title>
        <Badge color="orange" variant="filled">Unseen</Badge>
      </Group>
      <Text c="dimmed" size="sm">Pre-release takes from people who haven&apos;t seen the movie yet.</Text>

      {isAuthenticated ? (
        <OpinionForm />
      ) : (
        <Text size="sm">
          <Link to="/login">Log in</Link> to share your own opinion.
        </Text>
      )}

      <OpinionList opinions={opinions.results} isAuthenticated={isAuthenticated} currentUsername={currentUsername} />
    </Stack>
  )
}
