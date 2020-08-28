const express = require('express')
const app = express()
const favicon = require('serve-favicon');
const path = require('path')
const database = require('./database.js')
const env = process.env.NODE_ENV || 'development';
const port = env =='production'?8000:8001
const {root_dir, video_dir, database_dir} = require('./dirs.js').all(env)



app.set('view engine', 'pug')
app.use("/media/icon-chan.png", express.static('./media/icon-chan.png'))
app.use(favicon(path.join(__dirname, 'media', 'favicon.ico')))

prefix = path.resolve('../')
app.get('/', function (req, res) {
  json_result = database.readAsync(database_dir, function(err, data){
    key_list = []
    for(key in data)
      key_list.push(key)
    key_list.sort()
    sorted_data = {}
    for(index in key_list){
      key = key_list[index]
      sorted_data[key] = data[key]
    }

    res.render('index', {prefix:prefix, list: sorted_data})
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
