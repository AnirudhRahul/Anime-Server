const fs = require("fs");
// fs helper functions
function mkdir(dir){
  if (!fs.existsSync(dir))
      fs.mkdirSync(dir)
}
function mkfile(file_path){
  if (!fs.existsSync(file_path)) {
    fs.writeFileSync(file_path,'{}')
  }
}

const crypto = require('crypto')
function hash(string){
  return crypto.createHash("sha256")
          .update(string)
          .digest("base64");
}

const env = process.env.NODE_ENV || 'development';
const {root_dir, video_dir, database_dir, time_dir} = require('./dirs.js').all(env)
// Setup file structure if it doesnt exist
mkdir(root_dir); mkdir(video_dir); mkfile(database_dir); mkfile(time_dir);

const path = require('path');
const requester = require('./requester.js')
const database = require('./database.js')
const web_parser = require('./web_parser')
const torrent = require('./torrent')
const title_parser = require('./title_parser.js');


const max_concurrent_downloads = 1

function getTime(){
    return Math.floor(Date.now()/1000)
}

function format(name){
  // Remove special characters
  name = name.replace(/[^a-zA-Z0-9.'{}#]/g,' ')
  // Remove version tags
  name = name.replace(/v[0-9]/gi,'')
  // Remove periods but not decimal points
  name = name.replace(/(?<!\d)\.(?!\d)/g,' ')
  // Remove any hex tags in the string
  name = name.replace(/\b[A-F0-9]{6,8}\b/g, '')
  // Remove duplicate spaces
  name = name.replace(/  +/g, ' ');
  // Trim to remove trailing/leading spaces
  return name.trim()
}

function removeEpisodeIdentifier(str){
  return format(str).replace(/\{E\#\}/gi,'')
}

function updateTimeMap(show_name, time, time_dir){
  let temp = database.readSync(time_dir)
  temp[show_name] = time
  database.writeSync(temp, time_dir)
  temp = undefined
}

const parser = require('./parser.js')

let list = parser.get_shows()
if(list.length==0){
  console.log("Program Terminating no shows found")
  return
}
list.forEach(show => {mkdir(path.join(video_dir, show.name))});

let last_polled = database.readSync(time_dir)
list.forEach(show => {
  if(show.name in last_polled)
    show.last_polled=last_polled[show.name]
  else
    show.last_polled = 0
})
last_polled = undefined

//Sort by last_polled ascendingly
list.sort((itemA,itemB)=>(itemA.last_polled-itemB.last_polled))

console.log('Checking Nyaa.si')

const show = list[0]
list = undefined
if(show.last_polled == Number.MAX_SAFE_INTEGER){
  console.log("No more shows to check")
  return
}
console.log(show.name)
if(show.query)
  show.link = 'https://nyaa.si/?f=0&c=0_0&q='+encodeURI(removeEpisodeIdentifier(show.query))
if(!show.link || show.link.length<5){
  console.error("Missing link or query for", show.name)
  return
}
// Temp folder where show content is downloaded
show.path = path.join(video_dir, show.name)

requester.get(show.link)
.then((body) => {
  updateTimeMap(show.name, getTime(), time_dir)
  return body
})
// TODO: This is bad its not clear that parseBody filters shows that have already
// been downloaded
.then((body) => web_parser.parseBody(body, show.link, database_dir, show))
.then((resp) => {
  // Error checks
  if(resp.length==0){
    throw "ShowInputError: No results found for " + show.name + "\nQuery or Link field is likely malformed"
  }
  if(resp.length>1 && show.type!='Series'){
    throw "ShowInputError: Shows of type batch or movie must return 1 result\n" + show.link + " returned multiple results"
  }

  for(let i in resp){
    resp[i].magnet_hash = hash(resp[i].magnet_link)
  }
  // Assigns episode names from torrent_name for series/movies
  if(show.type!='Batch'){
    const title_parser = require('./title_parser.js')
    for(let i in resp)
      resp[i].episode = title_parser.parse(resp[i].torrent_name, show)
  }
  return resp
})
.then(resp => database.filter_downloaded_torrents(resp, show, database_dir))
.then((toDownload) => {
  if(toDownload.length == 0){
    return "Nothing to Download"
  }
  else if(show.type == 'Batch'){
    return torrent.batch(toDownload[0], show, database_dir)
  }
  else{
    return torrent.series(toDownload, show, database_dir)
  }
})
.then((res) => {
  if(!show.ongoing)
    updateTimeMap(show.name, Number.MAX_SAFE_INTEGER, time_dir)

  console.log('Finished Checking nyaa.si')
})
.catch((err)=>{
  console.error(err)
  if(err.toString().includes('Cannot find any peers!')){
    console.error(show.name, "seems to be dead, and will stop being polled");
    updateTimeMap(show.name, Number.MAX_SAFE_INTEGER, time_dir)
  }
  if(err.toString().startsWith('ShowInputError'))
    process.exit(9)
  else
    process.exit(1)
})
