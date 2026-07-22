import axios from 'axios'
import express from 'express'
import request from 'supertest'
import { getCredits, getDetails, getImages, getVideos } from '../movies'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

const app = express()

app.get('/movies/details', getDetails)
app.get('/movies/credits', getCredits)
app.get('/movies/images', getImages)
app.get('/movies/videos', getVideos)

const ROUTES = ['/movies/details', '/movies/credits', '/movies/images', '/movies/videos']

beforeEach(() => {
	mockedAxios.get.mockResolvedValue({ data: { id: 550 } })
})

afterEach(() => {
	jest.clearAllMocks()
})

// TMDB ids are always positive integers, but request.query.movieId is
// otherwise unvalidated (Express parses a missing key as undefined and a
// repeated key as an array) before being stringified straight into the
// upstream URL — see server/tmdb-wrapper/movie-db-wrapper.ts.
describe('movieId validation on TMDB-proxy routes', () => {
	test.each(ROUTES)('%s rejects a missing movieId', async(path) => {
		const response = await request(app).get(path)

		expect(response.status).toBe(400)
		expect(mockedAxios.get).not.toHaveBeenCalled()
	})

	test.each(ROUTES)('%s rejects a non-numeric movieId', async(path) => {
		const response = await request(app).get(path).query({ movieId: '550/../secret' })

		expect(response.status).toBe(400)
		expect(mockedAxios.get).not.toHaveBeenCalled()
	})

	test.each(ROUTES)('%s rejects a repeated movieId query key (parsed as an array)', async(path) => {
		const response = await request(app).get(`${path}?movieId=1&movieId=2`)

		expect(response.status).toBe(400)
		expect(mockedAxios.get).not.toHaveBeenCalled()
	})

	test.each(ROUTES)('%s accepts a valid numeric movieId and passes it straight through', async(path) => {
		const response = await request(app).get(path).query({ movieId: '550' })

		expect(response.status).toBe(200)
		expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/550'))
	})

	test('a movieId containing a path segment cannot inject an extra URL segment', async() => {
		await request(app).get('/movies/details').query({ movieId: '550' })

		const [calledUrl] = mockedAxios.get.mock.calls[0]

		expect(calledUrl).toContain('/movie/550?')
		expect(calledUrl).not.toContain('..')
	})
})
