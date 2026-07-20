import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongod: MongoMemoryServer

export async function connectTestDatabase(): Promise<void> {
	mongod = await MongoMemoryServer.create()
	await mongoose.connect(mongod.getUri())
}

export async function disconnectTestDatabase(): Promise<void> {
	await mongoose.disconnect()
	await mongod.stop()
}

export async function clearTestDatabase(): Promise<void> {
	const { collections } = mongoose.connection

	await Promise.all(Object.values(collections).map(collection => collection.deleteMany({})))
}
