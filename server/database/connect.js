import mongoose from 'mongoose'

const options = {
	maxPoolSize: 10
}

export const connectToDatabase = () =>
	mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/criticseven', options)
