export interface UserProfile {
	username: string
	honestyScore: number
	isLowTrust: boolean
	isPhoneVerified: boolean
	createdAt: string
}

export interface PaginatedList<T> {
	page: number
	totalPages: number
	totalResults: number
	results: T[]
}

export interface ReviewActivityItem {
	id: string
	movieId: number
	score: number
	comment: string
	createdAt: string
}

export interface OpinionActivityItem {
	id: string
	movieId: number
	hypeLevel: number
	comment: string
	createdAt: string
}

export interface ActivityMovie {
	id: number
	title: string
	posterUrl: string | null
	releaseYear: string | null
}
