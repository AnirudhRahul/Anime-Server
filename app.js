// const express = require('express')
// const app = express()
// const port = process.env.PORT
// app.set('view engine', 'ejs');
// var send = require('send')
//
//
// app.get('/', function(req, res) {
//     res.render('index');
// });
//
// app.listen(port, () => {
//   console.log(`Example app listening at http://localhost:${port}`)
// })
var http = require('http')
var parseUrl = require('parseurl')
var send = require('send')

var server = http.createServer(function onRequest (req, res) {
  send(req, parseUrl(req).pathname, { root: './downloads' })
    .pipe(res)
    console.log('got request')

})
server.listen(process.env.PORT)
