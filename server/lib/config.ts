import { Config, ConfigDocument } from '../database/models/config'

// Atomic upsert, not find-then-create: two concurrent callers racing to
// bootstrap the singleton must still land on the same document rather than
// both trying to insert one (the unique index on singletonKey would reject
// the loser, but findOneAndUpdate avoids the race entirely).
export async function getConfig(): Promise<ConfigDocument> {
	const config = await Config.findOneAndUpdate(
		{ singletonKey: 'singleton' },
		{ $setOnInsert: { singletonKey: 'singleton' } },
		{ upsert: true, new: true }
	)

	return config
}
