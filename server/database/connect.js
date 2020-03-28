import mongoose from 'mongoose'

const options = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	poolSize: 10,
	bufferMaxEntries: 0
}

export const connectToDatabase = () =>
	mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/criticseven', options)
