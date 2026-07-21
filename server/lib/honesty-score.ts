import { HonestyLog } from '../database/models/honesty-log'
import { User } from '../database/models/User'

const BASELINE_HONESTY_SCORE = 50
const HALF_LIFE_DAYS = 30
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

interface HonestyLogDelta {
	delta: number
	createdAt: Date
}

/*
 * Weighted AVERAGE of deltas around a neutral baseline, not a running sum —
 * a sum lets score drift unboundedly with volume; an average of a single
 * old pile-on stays exactly that pile-on's size forever, no matter how much
 * time passes, until fresh deltas arrive and outweigh it (weight decays
 * relative to *other* entries, it cancels out when an entry stands alone).
 * That's the intended recovery path: through new behavior, not through
 * waiting.
 */
export function computeDecayedHonestyScore(deltas: HonestyLogDelta[], now: Date = new Date()): number {
	if (deltas.length === 0) {
		return BASELINE_HONESTY_SCORE
	}

	let weightedDeltaSum = 0
	let weightSum = 0

	for (const entry of deltas) {
		const ageInDays = Math.max(0, (now.getTime() - entry.createdAt.getTime()) / MILLISECONDS_PER_DAY)
		const weight = 2 ** (-ageInDays / HALF_LIFE_DAYS)

		weightedDeltaSum += entry.delta * weight
		weightSum += weight
	}

	const weightedAverageDelta = weightedDeltaSum / weightSum

	return Math.min(100, Math.max(0, BASELINE_HONESTY_SCORE + weightedAverageDelta))
}

// Linear scale from voteWeightFloor (score 0) to 1.0 (score 100). Input is
// clamped defensively even though honestyScore is already clamped at the
// source, so a caller passing a stale or malformed value can't produce a
// weight outside [voteWeightFloor, 1.0].
export function computeVoterWeight(honestyScore: number, voteWeightFloor: number): number {
	const clampedScore = Math.min(100, Math.max(0, honestyScore))
	const scoreFraction = clampedScore / 100

	return voteWeightFloor + scoreFraction * (1 - voteWeightFloor)
}

export async function recalculateHonestyScore(userId: string): Promise<number> {
	const logs = await HonestyLog.find({ userId }).select('delta createdAt').lean()
	const score = computeDecayedHonestyScore(logs.map(log => ({ delta: log.delta, createdAt: log.createdAt })))

	await User.findByIdAndUpdate(userId, { honestyScore: score })

	return score
}

// Fire-and-forget entry point for vote/log writes: caller does not await
// this, so a slow or failing recalculation never blocks the request that
// triggered it.
export function enqueueHonestyScoreRecalculation(userId: string): void {
	recalculateHonestyScore(userId).catch(error => {
		console.error('Honesty score recalculation failed:', error.message)
	})
}
