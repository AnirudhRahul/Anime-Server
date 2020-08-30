const express = require('express')
const app = express()
const favicon = require('serve-favicon');
const path = require('path')
const fs = require('fs')
const database = require('./database.js')
const env = process.env.NODE_ENV || 'development';
const port = env =='production'?8000:8001
const {root_dir, video_dir, database_dir} = require('./dirs.js').all(env)

json_map = database.readSync(database_dir)
json_map = sortMap(json_map)
fs.watchFile(database_dir,{interval: 10000}, (cur) => {
  json_map = database.readSync(database_dir)
  json_map = sortMap(json_map)
});

app.set('view engine', 'pug')
app.use("/media/icon-chan.png", express.static('./media/icon-chan.png'))
app.use(favicon(path.join(__dirname, 'media', 'favicon.ico')))

prefix = path.resolve('../')
app.get('/', function (req, res) {
  res.render('index', {prefix:prefix, list: json_map})
})





app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})


function sortMap(map){
  key_list = []
  for(key in map){
    latest_time = -1
    map[key].forEach((item, i) => {
        latest_time = Math.max(latest_time,item['time_uploaded'])
    })
    key_list.push({'key':key,'time':latest_time})
  }
  key_list.sort((itemA,itemB)=>(itemB['time']-itemA['time']))
  sorted_map = {}
  for(index in key_list){
    const key = key_list[index]['key']
    sorted_map[key] = map[key]
  }
  return sorted_map
}
