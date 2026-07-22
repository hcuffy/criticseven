import cookieParser from 'cookie-parser'
import express from 'express'
import request from 'supertest'
import { DEFAULT_VOTE_WEIGHT_FLOOR } from '../../database/models/config'
import { HonestyLog } from '../../database/models/honesty-log'
import { TrailerOpinion } from '../../database/models/trailer-opinion'
import { User, UserDocument } from '../../database/models/User'
import { computeVoterWeight } from '../../lib/honesty-score'
import opinionRoutes from '../../routes/opinion-routes'
import voteRoutes from '../../routes/vote-routes'
import { SESSION_COOKIE_NAME } from '../../session'
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '../../test-support/database'
import { createSignedSessionCookieValue } from '../../test-support/session'

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use('/votes', voteRoutes())
app.use('/opinions', opinionRoutes())

const VOTE_HONESTY_DELTA_MAGNITUDE = 25

// Fixed, varied honesty scores rather than a single shared one — a
// meaningful property check needs voters whose weights actually differ, so
// a bug that only shows up when weights vary (or when a voter's weight
// must stay pinned across several operations) can't hide behind a
// coincidental cancellation.
const VOTER_HONESTY_SCORES = [100, 55, 0]

interface Operation {
	voterIndex: number
	action: 'vote' | 'delete'
	value?: 1 | -1
}

function sessionCookieFor(user: UserDocument) {
	const value = createSignedSessionCookieValue({ userId: user.id, username: user.username })

	return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

async function waitForLogCount(userId: string, expected: number, timeoutMs = 2000): Promise<void> {
	const start = Date.now()

	while (Date.now() - start < timeoutMs) {
		const count = await HonestyLog.countDocuments({ userId })

		if (count === expected) {
			return
		}

		await new Promise(resolve => setTimeout(resolve, 10))
	}

	throw new Error(`Timed out waiting for HonestyLog count to reach ${expected}`)
}

async function runSequence(operations: Operation[]) {
	const author = await User.create({ username: 'author', email: 'author@example.com', honestyScore: 50 })
	const voters = await Promise.all(
		VOTER_HONESTY_SCORES.map((honestyScore, index) =>
			User.create({ username: `voter${index}`, email: `voter${index}@example.com`, honestyScore }))
	)
	const opinion = await TrailerOpinion.create({ userId: author.id, movieId: 550, hypeLevel: 4, comment: '' })

	// Tracks, per voter, the weight pinned at their FIRST cast (FIX 5: a
	// change must reuse it, never recompute) and their current final vote
	// value (undefined once deleted).
	const originalWeightByVoter = new Map<number, number>()
	const finalValueByVoter = new Map<number, 1 | -1>()

	for (const operation of operations) {
		const voter = voters[operation.voterIndex]
		const cookie = sessionCookieFor(voter)

		if (!originalWeightByVoter.has(operation.voterIndex)) {
			originalWeightByVoter.set(
				operation.voterIndex,
				computeVoterWeight(VOTER_HONESTY_SCORES[operation.voterIndex], DEFAULT_VOTE_WEIGHT_FLOOR)
			)
		}

		if (operation.action === 'vote') {
			await request(app).post('/votes').set('Cookie', cookie).send({
				targetType: 'opinion', targetId: opinion.id, voteValue: operation.value
			})
			finalValueByVoter.set(operation.voterIndex, operation.value as 1 | -1)
		} else {
			await request(app).delete('/votes').set('Cookie', cookie).send({
				targetType: 'opinion', targetId: opinion.id
			})
			finalValueByVoter.delete(operation.voterIndex)
		}
	}

	const expectedEntries = Array.from(finalValueByVoter.entries())
		.map(([voterIndex, finalValue]) => {
			const weight = originalWeightByVoter.get(voterIndex) as number

			return { delta: finalValue * weight * VOTE_HONESTY_DELTA_MAGNITUDE }
		})
		.sort((a, b) => a.delta - b.delta)

	await waitForLogCount(author.id, expectedEntries.length)

	const actualEntries = (await HonestyLog.find({ userId: author.id }).select('delta').lean())
		.map(entry => ({ delta: entry.delta }))
		.sort((a, b) => a.delta - b.delta)

	return { expectedEntries, actualEntries }
}

beforeAll(async() => {
	await connectTestDatabase()
})

afterAll(async() => {
	await disconnectTestDatabase()
})

afterEach(async() => {
	await clearTestDatabase()
})

/*
 * Property under test: for any sequence of vote/change/delete operations by
 * N voters against one target, HonestyLog must always contain exactly one
 * entry per voter with a currently-active vote, with a delta computed from
 * that voter's ORIGINAL cast-time weight and their FINAL vote value —
 * identical to what a from-scratch vote of that same final state would
 * produce. This is the exact property the audit's delta-on-change bug
 * (incremental swings appended on top of a stale entry) violated, and
 * would have caught it: the pre-fix code left extra/stale entries behind
 * whenever a vote changed more than once.
 */
describe.each<[string, Operation[]]>([
	[
		'repeated changes by a single voter (up, down, up)',
		[
			{ voterIndex: 0, action: 'vote', value: 1 },
			{ voterIndex: 0, action: 'vote', value: -1 },
			{ voterIndex: 0, action: 'vote', value: 1 }
		]
	],
	[
		'two voters interleaved, one changes their mind, one deletes and revotes',
		[
			{ voterIndex: 0, action: 'vote', value: 1 },
			{ voterIndex: 1, action: 'vote', value: 1 },
			{ voterIndex: 0, action: 'vote', value: -1 },
			{ voterIndex: 1, action: 'delete' },
			{ voterIndex: 1, action: 'vote', value: -1 }
		]
	],
	[
		'a single voter fully cycles (vote, delete, vote, change, delete) — ends with no vote at all',
		[
			{ voterIndex: 0, action: 'vote', value: 1 },
			{ voterIndex: 0, action: 'delete' },
			{ voterIndex: 0, action: 'vote', value: -1 },
			{ voterIndex: 0, action: 'vote', value: 1 },
			{ voterIndex: 0, action: 'delete' }
		]
	],
	[
		'three voters with different weights, mixed changes and one deletion',
		[
			{ voterIndex: 0, action: 'vote', value: 1 },
			{ voterIndex: 1, action: 'vote', value: -1 },
			{ voterIndex: 2, action: 'vote', value: 1 },
			{ voterIndex: 0, action: 'vote', value: -1 },
			{ voterIndex: 1, action: 'vote', value: 1 },
			{ voterIndex: 2, action: 'delete' },
			{ voterIndex: 0, action: 'delete' }
		]
	]
])('delta-on-change property: %s', (_description, operations) => {
	test('HonestyLog exactly matches a from-scratch vote of the final state', async() => {
		const { expectedEntries, actualEntries } = await runSequence(operations)

		expect(actualEntries).toHaveLength(expectedEntries.length)

		for (let index = 0; index < expectedEntries.length; index++) {
			expect(actualEntries[index].delta).toBeCloseTo(expectedEntries[index].delta, 6)
		}
	})
})
