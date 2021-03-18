const express = require('express')
// express.static.mime.types['wasm'] = 'application/wasm'
express.static.mime.define({'application/wasm': ['wasm']})

const app = express()
const favicon = require('serve-favicon');
const path = require('path')
const fs = require('fs')
const database = require('./database.js')
const env = process.env.NODE_ENV || 'development';
const port = env =='production'?8000:8001
const {root_dir, video_dir, database_dir} = require('./dirs.js').all(env)

name_map = {}; ongoing_map = {};
function poll_show_list(){
  const show_list = require('./parser.js').get_shows()
  for(show of show_list){
    name_map[show.name] = show.official_name
    ongoing_map[show.name] = show.ongoing
  }
}
poll_show_list()
setInterval(poll_show_list, 10000)

json_map = {}; done_episode_list=[]; ongoing_episode_list=[];
function poll_database(){
  json_map = sortMap(database.readSync(database_dir));
  done_episode_list = getEpisodes(json_map, ongoing_map, false)
  ongoing_episode_list = getEpisodes(json_map, ongoing_map, true)
}
poll_database()
fs.watchFile(database_dir,{interval: 10000}, (cur) => {
  poll_database()
});

app.set('view engine', 'pug')
app.use(express.static('public',{
  etag: true
}))
app.use(express.static('public_nocache',{
  etag: false
}))

app.use(favicon(path.join(__dirname, 'public', 'media', 'favicon.ico')))

prefix = path.resolve('../')

app.get('/', function (req, res) {
  res.redirect('/latest');
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

const length_per_page = 100
app.get('/latest', function (req, res) {
  // let offset = 0
  // if(req.query.offset && !isNaN(req.query.offset))
  //   offset = parseInt(req.query.offset)
  // if(offset<0)
  //   offset = 0
  // res.render('latest', {episode_list: episode_list.slice(offset, offset+length_per_page)})
  res.render('latest', {episode_list: ongoing_episode_list})
})

app.get('/completed', function (req, res) {
  res.render('latest', {episode_list: done_episode_list})
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

  const cur_episode = json_map[req.params.show][episode_index]
  // console.log("subtitle path", cur_episode?.metadata?.subtitle_path);
  prev_episode = -1
  try{
    prev_episode = json_map[req.params.show][episode_index+1]['episode']
  }catch(err){}

  next_episode = -1
  try{
    next_episode = json_map[req.params.show][episode_index-1]['episode']
  }catch(err){}

  let official_name = cur_episode.show_name
  if(official_name in name_map && name_map[official_name].length > 0)
    official_name = name_map[official_name]

  res.render('episode', {
    data:cur_episode,
    prev:prev_episode,
    next:next_episode,
    official_name: official_name
  })
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

function getEpisodes(map, ongoing_map, filter){
  const output = []
  for(show_name in map){
      if((ongoing_map[show_name] || false)==filter)
        output.push(...map[show_name])
  }
  output.sort((episodeA,episodeB)=>
    (episodeB['time_uploaded']-episodeA['time_uploaded'])
  )
  return output
}
