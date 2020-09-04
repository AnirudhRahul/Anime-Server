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
app.use(express.static('public'))
app.use(favicon(path.join(__dirname, 'public', 'media', 'favicon.ico')))

prefix = path.resolve('../')

app.get('/', function (req, res) {
  res.redirect('/shows');
})

app.get('/shows', function (req, res) {
  res.render('shows', {prefix:prefix, list: json_map})
})

app.get('/movies', function (req, res) {
  res.render('movies', {prefix:prefix, list: json_map})
})

app.get('/about', function (req, res) {
  res.render('docs/about', {version: '1.01'})
})

app.get('/controls', function (req, res) {
  res.render('docs/controls')
})

app.get('/controls', function (req, res) {
  res.render('docs/controls')
})

app.get('/latest', function (req, res) {
  res.render('latest', {prefix:prefix, list: json_map})
})

app.get('/show/:show/episode/:episode', function (req, res) {
  if(!(req.params.show in json_map))
    res.send("Show not found")

  episode_index = -1
  for(index in json_map[req.params.show]){
    if(json_map[req.params.show][index]['episode']==req.params.episode){
      episode_index = parseInt(index)
      break
    }
  }
  if(episode_index===-1)
    res.status(404).send("Episode not found")

  cur_episode = json_map[req.params.show][episode_index]
  prev_episode = -1
  try{
    prev_episode = json_map[req.params.show][episode_index+1]['episode']
  }catch(err){}

  next_episode = -1
  try{
    next_episode = json_map[req.params.show][episode_index-1]['episode']
  }catch(err){}

  res.render('episode', {data:cur_episode,prev:prev_episode,next:next_episode})
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
    sorted_map[key].sort((showA,showB)=>
      (showB['time_uploaded']-showA['time_uploaded'])
    )
  }
  return sorted_map
}
