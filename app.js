const express = require('express')
const app = express()
const port = process.env.PORT || 8001
const data_dir = process.env.DOWNLOAD_DIR || "./media/dev"
var favicon = require('serve-favicon');
const path = require('path')
const database = require('./database.js')


app.set('view engine', 'pug')
app.use("/media/icon-chan.png", express.static('./media/icon-chan.png'))
app.use(favicon(path.join(__dirname, 'media', 'favicon.ico')))

database_dir = path.join(data_dir, 'database.txt')
prefix = process.env.PREFIX || 'media'
app.get('/', function (req, res) {
  json_result = database.readAsync(database_dir, function(err, data){
    res.render('index', {prefix:prefix, list: data})
  })
})

app.listen(port, "0.0.0.0", () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
