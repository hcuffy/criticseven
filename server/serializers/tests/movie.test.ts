import { toMoviePublicDTO } from '../movie'

const movie = {
	id: '507f1f77bcf86cd799439011',
	title: 'Sinners',
	trailerUrl: 'https://example.com/trailer',
	metadata: { tmdbId: 12345, secretInternalNote: 'do not leak' }
}

describe('movie serializer allowlist', () => {
	test('public DTO drops metadata', () => {
		const dto = toMoviePublicDTO(movie as never)

		expect(Object.keys(dto).sort()).toEqual(['id', 'title', 'trailerUrl'])
		expect(dto).not.toHaveProperty('metadata')
	})
})
