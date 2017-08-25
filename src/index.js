import express from 'express'
import http from 'http'
import path from 'path'
import crypto from 'crypto'

export default function (app, options = {}) {
  const _options = {
    root: 'http://localhost:8080',
    entry: '/',
    endpoint: '/qr'
  }
  Object.assign(_options, options)

  const server = http.createServer(app)
  const io = require('socket.io')(server)
  const publicPath = path.join(__dirname, '../public/')

  const connected = {}

  io.on('connect', function (socket) {
    console.log('Connected:', socket.id)
    const token = generateToken()
    connected[token] = socket
    socket.emit('update QR', token)
    socket.on('disconnect', function () {
      console.log('Disconnected:', socket.id)
      connected[token] = null
    })
  })

  app.get(_options.entry, function (req, res, next) {
    if (!('token' in req.query)) return res.sendStatus(403)
    if (!(req.query.token in connected)) return res.sendStatus(403)

    const socket = connected[req.query.token]
    delete connected[req.query.token]

    if (socket) {
      const newToken = generateToken()
      console.log('Refreshed:', socket.id)
      socket.emit('update QR', newToken)
      connected[newToken] = socket
    }
    next()
  })

  app.get(_options.endpoint + '/script.js', function (req, res) {
    res.send(`
      var socket = io()
      var qr = new QRCode('qr-code')
      socket.on('update QR', function (token) {
        console.log('QR updated')
        var url = '${_options.root}${_options.entry}?token=' + token
        qr.clear()
        qr.makeCode(url)
        document.querySelector('.plain-url').textContent = url
      })
    `)
  })

  app.use(_options.endpoint, express.static(publicPath))

  app.listen = function () {
    return server.listen.apply(server, arguments)
  }

  return app
}

function generateToken (length = 5) {
  return crypto.randomBytes(length).toString('hex')
}
