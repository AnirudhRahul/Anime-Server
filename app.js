const express = require('express')
// express.static.mime.types['wasm'] = 'application/wasm'
express.static.mime.define({'application/wasm': ['wasm']})
const app = express()
const expressWs = require(`@wll8/express-ws`)
expressWs(app)
const bodyParser = require('body-parser')
app.use(bodyParser.json())
const favicon = require('serve-favicon');
const path = require('path')
const fs = require('fs')
const database = require('./database.js')
const randomstring = require("randomstring").generate;
const env = process.env.NODE_ENV || 'production';
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

json_map = {};
done_episode_list=[];
ongoing_episode_list=[];
combined=[];
function poll_database(){
  json_map = sortMap(database.readSync(database_dir));
  done_episode_list = getEpisodes(json_map, ongoing_map, false)
  ongoing_episode_list = getEpisodes(json_map, ongoing_map, true)
  combined = []
  combined.push(...ongoing_episode_list)
  combined.push(...done_episode_list)
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
var Rooms = new Map()

class Room {
  constructor(state, pos, episodeUrl) {
    this.episodeUrl = episodeUrl
    console.log(episodeUrl)
    this.state = state;
    this.pos = pos;
    this.userSockets = [];
    this.lastUpdated = Date.now()
    this.maxPing = 125;
  }

  update(state, pos, sentAt, sender){
    if(sentAt < this.lastUpdated){
      sender.send("Rejected update wait for last one to finish")
      return
    }
    this.state = state;
    this.pos = pos;
    this.lastUpdated = sentAt + this.maxPing
    for(const ws of this.userSockets){
      ws.send(JSON.stringify({
        state: state,
        pos: pos,
        waitTill: this.lastUpdated
      }))
    }
  }

  updateMaxPing(userPing){
    this.maxPing = Math.max(2*userPing, this.maxPing)
  }

  addUser(user){
    this.userSockets.push(user)
    user.send(JSON.stringify({
      state: this.state,
      pos: this.pos,
      heardAt: this.lastUpdated,
    }))
  }
}

app.post('/createRoom', function (req, res) {
  let randomStr = randomstring(4)
  while(Rooms.has(randomStr)){
    randomStr = randomstring(4)
  }
  const url = new URL(req.body.baseUrl);
  url.searchParams.append("room", randomStr)
  Rooms.set(randomStr, new Room("pause", 0, url.toString()))
  res.send({url: url.toString()});
})

app.get('/join/:roomId', function (req, res) {
  const roomId = req.params.roomId
  if(Rooms.has(roomId)){
    res.redirect(Rooms.get(roomId).episodeUrl)
  }
  else
    res.send("Room not found").status(404);
})

app.ws('/joinRoom/:roomId', function (ws, req){
  const roomId = req.params.roomId
  if(!Rooms.has(roomId)){
    console.error("Room doesnt exist")
    ws.close()
    return
  }
  const room = Rooms.get(roomId)
  console.log("has", roomId)
  room.addUser(ws)
  console.log("added user", room)
  
  ws.on('message', function(msg) {
    try {
      const {state, sentAt, position} = JSON.parse(msg);
      if(state == "ping"){
        room.updateMaxPing(Date.now()-sentAt)
      }
      else{
        room.update(state, position, sentAt, ws)
      }
    } catch(err){
      console.error(err)
    }

  });

})

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
  res.render('latest', {episode_list: combined})
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
  const cur_episode = json_map[req.params.show][episode_index]

  if(episode_index===-1 || !cur_episode)
    res.status(404).send("Episode not found")

  let prev_episode = -1
  try{
    prev_episode = json_map[req.params.show][episode_index+1]['episode']
  }catch(err){}

  let next_episode = -1
  try{
    next_episode = json_map[req.params.show][episode_index-1]['episode']
  }catch(err){}

  let official_name = cur_episode.show_name
  if(official_name in name_map && name_map[official_name].length > 0)
    official_name = name_map[official_name]

  let os = req.headers['user-agent'].indexOf("Win")!=-1? "Windows":"Mac";

  res.render('episode', {
    data: cur_episode,
    prev: prev_episode,
    next: next_episode,
    official_name: official_name,
    os: os,
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
