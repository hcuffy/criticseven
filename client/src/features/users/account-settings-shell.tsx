import { Divider, Stack, Text, Title } from '@mantine/core'
import React from 'react'

// Own-profile-only section. Shell for now — the delete-account feature
// fills this in with the actual confirmation UI.
export default function AccountSettingsShell() {
	return (
		<Stack gap="xs" mt="lg">
			<Divider />
			<Title order={3}>Account settings</Title>
			<Text c="dimmed" size="sm">More settings coming soon.</Text>
		</Stack>
	)
}
