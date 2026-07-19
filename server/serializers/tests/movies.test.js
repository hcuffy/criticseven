import {
	toMovieCreditsDTO, toMovieDetailsDTO, toMovieImagesDTO, toMovieListDTO, toMovieSummaryDTO
} from '../movies'

const tmdbMovie = {
	id: 550,
	title: 'Fight Club',
	overview: 'An insomniac office worker...',
	poster_path: '/poster.jpg',
	backdrop_path: '/backdrop.jpg',
	release_date: '1999-10-15',
	vote_average: 8.4,
	vote_count: 26000,
	genre_ids: [18],
	adult: false,
	popularity: 61.4,
	video: false,
	original_language: 'en'
}

describe('movie serializers allowlist', () => {
	test('summary DTO drops non-allowlisted TMDB fields', () => {
		const dto = toMovieSummaryDTO(tmdbMovie)

		expect(Object.keys(dto).sort()).toEqual([
			'backdrop_path', 'genre_ids', 'id', 'overview', 'poster_path',
			'release_date', 'title', 'vote_average', 'vote_count'
		])
		expect(dto.title).toBe('Fight Club')
	})

	test('details DTO drops non-allowlisted TMDB fields', () => {
		const dto = toMovieDetailsDTO({
			...tmdbMovie, runtime: 139, tagline: 'Mischief.', genres: [{id: 18, name: 'Drama'}], budget: 63000000, imdb_id: 'tt0137523'
		})

		expect(Object.keys(dto).sort()).toEqual([
			'backdrop_path', 'genres', 'id', 'overview', 'poster_path',
			'release_date', 'runtime', 'tagline', 'title', 'vote_average', 'vote_count'
		])
	})

	test('list DTO shapes pagination and maps results', () => {
		const dto = toMovieListDTO({
			page: 1, total_pages: 10, total_results: 200, results: [tmdbMovie], dates: {maximum: 'x', minimum: 'y'}
		})

		expect(Object.keys(dto).sort()).toEqual(['page', 'results', 'total_pages', 'total_results'])
		expect(dto.results).toHaveLength(1)
		expect(dto.results[0].adult).toBeUndefined()
	})

	test('credits DTO allowlists cast and crew members', () => {
		const dto = toMovieCreditsDTO({
			id: 550,
			cast: [{
				id: 819, name: 'Edward Norton', character: 'The Narrator', profile_path: '/p.jpg', order: 0, cast_id: 4, credit_id: 'abc'
			}],
			crew: [{
				id: 7467, name: 'David Fincher', job: 'Director', department: 'Directing', profile_path: '/d.jpg', credit_id: 'def'
			}]
		})

		expect(Object.keys(dto.cast[0]).sort()).toEqual(['character', 'id', 'name', 'order', 'profile_path'])
		expect(Object.keys(dto.crew[0]).sort()).toEqual(['department', 'id', 'job', 'name', 'profile_path'])
	})

	test('images DTO allowlists image entries and tolerates missing arrays', () => {
		const dto = toMovieImagesDTO({
			id: 550,
			backdrops: [{
				file_path: '/b.jpg', width: 1280, height: 720, aspect_ratio: 1.78, iso_639_1: 'en', vote_average: 5
			}]
		})

		expect(Object.keys(dto.backdrops[0]).sort()).toEqual(['aspect_ratio', 'file_path', 'height', 'width'])
		expect(dto.posters).toEqual([])
	})
})
