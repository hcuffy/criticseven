import { ActionIcon, Group, Text } from '@mantine/core'
import React from 'react'
import { useFetcher, useNavigate } from 'react-router'

export interface VoteButtonsProps {
  targetType: 'opinion' | 'review'
  targetId: string
  netVoteCount: number
  viewerVote: 1 | -1 | null
  isAuthenticated: boolean
}

interface VoteActionData {
  intent: 'vote' | 'unvote'
  error?: string
}

// Voting is JS-driven (useFetcher), unlike the opinion/review forms — the
// task calls for optimistic UI here specifically, so this component doesn't
// carry a no-JS fallback the way client/src/ui/rating-input.tsx does.
export default function VoteButtons({ targetType, targetId, netVoteCount, viewerVote, isAuthenticated }: VoteButtonsProps) {
  const fetcher = useFetcher<VoteActionData>()
  const navigate = useNavigate()

  const isPendingForThisTarget = fetcher.state !== 'idle' && fetcher.formData?.get('targetId') === targetId
  const pendingIntent = isPendingForThisTarget ? fetcher.formData?.get('intent') : null

  // What viewerVote will become once this in-flight submission lands —
  // 'unvote' clears it, 'vote' sets it to the value being submitted, and
  // with nothing pending it's just whatever the server last reported.
  const optimisticViewerVote: 1 | -1 | null = pendingIntent === 'unvote'
    ? null
    : pendingIntent === 'vote'
      ? (Number(fetcher.formData?.get('voteValue')) as 1 | -1)
      : viewerVote
  const optimisticNetVoteCount = netVoteCount + ((optimisticViewerVote ?? 0) - (viewerVote ?? 0))

  function vote(clickedValue: 1 | -1) {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Tapping the already-active button removes the vote (standard
    // upvote/downvote toggle behavior) instead of re-submitting it.
    if (viewerVote === clickedValue) {
      fetcher.submit({ intent: 'unvote', targetType, targetId }, { method: 'post' })
      return
    }

    fetcher.submit(
      { intent: 'vote', targetType, targetId, voteValue: String(clickedValue) },
      { method: 'post' }
    )
  }

  return (
    <Group gap={4}>
      <ActionIcon
        variant={optimisticViewerVote === 1 ? 'filled' : 'subtle'}
        color={optimisticViewerVote === 1 ? 'orange' : 'gray'}
        aria-label="Upvote"
        aria-pressed={optimisticViewerVote === 1}
        onClick={() => vote(1)}
      >
        ▲
      </ActionIcon>
      <Text size="sm" fw={500} miw={20} ta="center">
        {optimisticNetVoteCount}
      </Text>
      <ActionIcon
        variant={optimisticViewerVote === -1 ? 'filled' : 'subtle'}
        color={optimisticViewerVote === -1 ? 'blue' : 'gray'}
        aria-label="Downvote"
        aria-pressed={optimisticViewerVote === -1}
        onClick={() => vote(-1)}
      >
        ▼
      </ActionIcon>
      {fetcher.data?.error ? <Text c="red" size="xs">{fetcher.data.error}</Text> : null}
    </Group>
  )
}
