import cookieParser from 'cookie-parser'
import debugLib from 'debug'
import 'dotenv/config'
import express from 'express'
import http from 'http'
import logger from 'morgan'
import path from 'path'
import {connectToDatabase} from './database/connect'
import routes from './routes'

connectToDatabase()

const app = express()

const server = http.createServer(app)

const port = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, 'public')))

app.use(logger('dev'))
app.use(express.json())
app.use(
	express.urlencoded({
		extended: false
	})
)
app.use(cookieParser())
app.use('/', routes)

const debug = debugLib('criticseven:server')

function onListening() {
	const addr = server.address()

	const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`

	debug(`Listening on ${bind}`)
}

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error
	}

	const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

	switch (error.code) {
	case 'EACCES':
		console.error(`${bind} requires elevated privileges`)
		process.exit(1)
		break
	case 'EADDRINUSE':
		console.error(`${bind} is already in use`)
		process.exit(1)
		break
	default:
		throw error
	}
}

server.listen(port, () => {
	console.log('Server running on port', port)
})

server.on('error', onError)
server.on('listening', onListening)
