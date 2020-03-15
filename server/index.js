import path from 'path'
import 'dotenv/config.js'
import mongoose from 'mongoose'
import express from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import http from 'http'
import debugLib from 'debug'
import routes from './routes'

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/criticseven', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 5000

app.use(express.static(path.join(__dirname, 'public')))

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use('/', routes)

const debug = debugLib('criticseven:server')

function onListening() {
  var addr = server.address()
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  debug('Listening on ' + bind)
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
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
