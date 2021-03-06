require('dotenv').config({silent: true});
const log = new (require('./logger'))('server/main')

const http = require('http')
const koa = require('koa')
const app = koa()
const _io = require('socket.io')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const mount = require('koa-mount')
const serve = require('koa-static')
const Dbox = require('./Dbox')

// Create the server and socket.io server
const server = http.createServer(app.callback())
const io = _io(server, { transports: ['websocket'], wsEngine: 'uws' })

// Body parser
app.use(bodyParser())
app.use(mount('/dist', serve('./dist')))
app.use(mount('/assets', serve('./assets')))

// Construct the Dbox!
const D = new Dbox(router, io, app.context)

// Request logger
app.use(function *(next) {
	log.request("start")
	let timeStart = new Date()
	yield next
	let timeElapsed = new Date() - timeStart

	log.request(`${this.status} ${this.method} ${this.url} - ${this.ip} - took ${timeElapsed}ms`)
})

// Mount the router last
app.use(router.routes()).use(router.allowedMethods())

// Start it!
//TODO: configurate!
log.info(`starting HTTP server on ${process.env.APP_PORT || 4000}`)
server.listen(process.env.APP_PORT || 4000)