export const API_KEY = "API_KEY"

export const fakeMovieList =  {
	"page": 1,
	"results": [
		{
			"poster_path": "/post.jpg",
			"adult": false,
			"overview": "Testing Date",
			"release_date": "2016-08-03",
			"genre_ids": [
				23, 12, 78
			],
			"id": 33223,
			"original_title": "Testing Original",
			"original_language": "en",
			"title": "Testing Original",
			"backdrop_path": "/backdrop.jpg",
			"popularity": 78.9,
			"vote_count": 1500,
			"video": false,
			"vote_average": 9.91
		}
	],
	"total_results": 21394,
	"total_pages": 345
}

export const fakeMovie  = {
	"adult": false,
	"backdrop_path": "/back.jpg",
	"belongs_to_collection": null,
	"budget": 9999,
	"genres": [
	  {
			"id": 23,
			"name": "Drama"
	  }
	],
	"homepage": "wwww.page.com",
	"id": 333,
	"imdb_id": "tt4534",
	"original_language": "en",
	"original_title": "Testing Original",
	"overview": "overview",
	"popularity": 0.5,
	"poster_path": null,
	"production_companies": [
	  {
			"id": 545,
			"logo_path": "/logo.png",
			"name": "Movie company",
			"origin_country": "US"
	  }
	],
	"production_countries": [{
		"iso_3166_1": "US",
		"name": "United States of America"
	  }],
	"release_date": "2020-02-02",
	"revenue": 345453545,
	"runtime": 120,
	"spoken_languages": [
	  {
			"iso_639_1": "en",
			"name": "English"
	  }
	],
	"status": "Released",
	"tagline": "a movie",
	"title": "Testing Original",
	"video": false,
	"vote_average": 9.9,
	"vote_count": 3439
}

export const fakeImageInfo = {
	"id": 550,
	"backdrops": [
		{
			"aspect_ratio": 1.343343434,
			"file_path": "/back.jpg",
			"height": 600,
			"iso_639_1": "US",
			"vote_average": 0,
			"vote_count": 0,
			"width": 1280
		}
	],
	"posters" : [
		{
			"aspect_ratio": 0.66666666,
			"file_path": "/poster.jpg",
			"height": 1800,
			"iso_639_1": "en",
			"vote_average": 0,
			"vote_count": 0,
			"width": 1280
		}
	]
}

export const fakeCredits ={
	"id": 222,
	"cast": [
	  {
			"cast_id": 1,
			"character": "Bob Tester",
			"credit_id": "5647385f45364gd657487560",
			"gender": 2,
			"id": 888,
			"name": "The Actor",
			"order": 0,
			"profile_path": "/profile.jpg"
	  }
	],
	"crew": [
	  {
			"credit_id": "5647385f45364gd657487f44",
			"department": "Sound",
			"gender": 0,
			"id": 4444,
			"job": "Hold the Microphone",
			"name": "John tester",
			"profile_path": "/profile2.jpg"
	  }
	]
}