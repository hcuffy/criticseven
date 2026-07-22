import { Group, Radio } from '@mantine/core'
import React from 'react'

export interface RatingInputProps {
  name: string
  label: string
  min?: number
  max?: number
  defaultValue?: number
}

// Real radio inputs under a Radio.Group, submitted natively via
// `<Form method="post">` — no JS needed to submit a rating, matching the
// SSR/no-JS story the review and opinion forms both rely on.
export default function RatingInput({ name, label, min = 1, max = 10, defaultValue }: RatingInputProps) {
  const options = Array.from({ length: max - min + 1 }, (_, index) => min + index)

  return (
    <Radio.Group name={name} label={label} defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}>
      <Group gap="xs" mt="xs">
        {options.map(option => (
          <Radio key={option} value={String(option)} label={option} />
        ))}
      </Group>
    </Radio.Group>
  )
}
