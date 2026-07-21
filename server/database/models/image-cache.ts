import mongoose, { Schema } from 'mongoose'

export interface ImageCacheDocument extends mongoose.Document {
	tmdbImagePath: string
	cloudflareImageUrl: string
	createdAt: Date
}

const imageCacheSchema = new Schema<ImageCacheDocument>({
	tmdbImagePath: { type: String, required: true, unique: true },
	cloudflareImageUrl: { type: String, required: true },
	createdAt: { type: Date, default: Date.now }
})

export const ImageCache =
	mongoose.models.ImageCache || mongoose.model<ImageCacheDocument>('ImageCache', imageCacheSchema)
