import { computeDecayedHonestyScore, computeVoterWeight } from '../honesty-score'

const DAY = 24 * 60 * 60 * 1000

describe('computeDecayedHonestyScore', () => {
	test('no history returns the neutral baseline', () => {
		expect(computeDecayedHonestyScore([])).toBe(50)
	})

	test('a single positive delta shifts the score up from baseline', () => {
		const now = new Date('2026-01-01T00:00:00.000Z')
		const score = computeDecayedHonestyScore([{ delta: 20, createdAt: now }], now)

		expect(score).toBe(70)
	})

	test('a single negative delta shifts the score down from baseline', () => {
		const now = new Date('2026-01-01T00:00:00.000Z')
		const score = computeDecayedHonestyScore([{ delta: -20, createdAt: now }], now)

		expect(score).toBe(30)
	})

	test('clamps at 100 rather than climbing past it on repeated large positive deltas', () => {
		const now = new Date('2026-01-01T00:00:00.000Z')
		const deltas = Array.from({ length: 10 }, () => ({ delta: 200, createdAt: now }))

		expect(computeDecayedHonestyScore(deltas, now)).toBe(100)
	})

	test('clamps at 0 rather than going negative on repeated large negative deltas', () => {
		const now = new Date('2026-01-01T00:00:00.000Z')
		const deltas = Array.from({ length: 10 }, () => ({ delta: -200, createdAt: now }))

		expect(computeDecayedHonestyScore(deltas, now)).toBe(0)
	})

	test('is an average, not a sum: many small identical deltas do not outweigh one large one', () => {
		const now = new Date('2026-01-01T00:00:00.000Z')

		const manySmall = computeDecayedHonestyScore(
			Array.from({ length: 50 }, () => ({ delta: 1, createdAt: now })),
			now
		)
		const oneLarge = computeDecayedHonestyScore([{ delta: 1, createdAt: now }], now)

		expect(manySmall).toBe(oneLarge)
	})

	test('a lone old pile-on does not fade back toward baseline just from elapsed time', () => {
		const now = new Date('2026-01-01T00:00:00.000Z')
		const sixMonthsAgo = new Date(now.getTime() - 180 * DAY)

		const score = computeDecayedHonestyScore([{ delta: -30, createdAt: sixMonthsAgo }], now)

		expect(score).toBe(20)
	})

	test('recovery comes from fresh good behavior outweighing an old pile-on, not from waiting', () => {
		const now = new Date('2026-01-01T00:00:00.000Z')
		const sixMonthsAgo = new Date(now.getTime() - 180 * DAY)

		const scoreWithOnlyPileOn = computeDecayedHonestyScore([{ delta: -30, createdAt: sixMonthsAgo }], now)
		const scoreWithRecentRecovery = computeDecayedHonestyScore(
			[
				{ delta: -30, createdAt: sixMonthsAgo },
				{ delta: 20, createdAt: now }
			],
			now
		)

		expect(scoreWithRecentRecovery).toBeGreaterThan(scoreWithOnlyPileOn)
	})

	test('a recent delta outweighs an equally sized but much older one', () => {
		const now = new Date('2026-01-01T00:00:00.000Z')
		const yearAgo = new Date(now.getTime() - 365 * DAY)

		const deltas = [
			{ delta: -40, createdAt: yearAgo },
			{ delta: 40, createdAt: now }
		]

		expect(computeDecayedHonestyScore(deltas, now)).toBeGreaterThan(50)
	})
})

describe('computeVoterWeight', () => {
	test('score of 0 maps to exactly the floor', () => {
		expect(computeVoterWeight(0, 0.2)).toBeCloseTo(0.2)
	})

	test('score of 100 maps to exactly 1.0', () => {
		expect(computeVoterWeight(100, 0.2)).toBeCloseTo(1.0)
	})

	test('score of 50 maps to the midpoint between floor and 1.0', () => {
		expect(computeVoterWeight(50, 0.2)).toBeCloseTo(0.6)
	})

	test('a floor of 0 behaves as a plain linear 0-100 -> 0-1 scale', () => {
		expect(computeVoterWeight(0, 0)).toBeCloseTo(0)
		expect(computeVoterWeight(50, 0)).toBeCloseTo(0.5)
		expect(computeVoterWeight(100, 0)).toBeCloseTo(1.0)
	})

	test('an out-of-range score below 0 is clamped before scaling, not extrapolated', () => {
		expect(computeVoterWeight(-50, 0.2)).toBeCloseTo(0.2)
	})

	test('an out-of-range score above 100 is clamped before scaling, not extrapolated', () => {
		expect(computeVoterWeight(150, 0.2)).toBeCloseTo(1.0)
	})
})
