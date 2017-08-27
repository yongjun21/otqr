import express from 'express'
import plugin from '../src/index'

const app = plugin(express(), {entryPath: '/entry.html'})

const port = process.env.PORT || 8080

app.use(express.static(__dirname))

app.listen(port, function () {
  console.log('Listening on port', port)
})
