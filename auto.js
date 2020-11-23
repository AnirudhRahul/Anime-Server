const fs = require("fs");
const path = require('path');
const parser = require('./parser.js')
// const EventEmitter = require('events');

function mkdir(dir){
  if (!fs.existsSync(dir))
      fs.mkdirSync(dir)
}

function mkfile(path){
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path,'{}')
  }
}

function getTime(){
    return Math.floor(new Date() / 1000)
}

//Initial Setup
const env = process.env.NODE_ENV || 'development';

//Declares, root_dir, video_dir, database_dir
const {root_dir, video_dir, database_dir, time_dir} = require('./dirs.js').all(env)
mkdir(root_dir)
mkdir(video_dir)
mkfile(database_dir)
mkfile(time_dir)


const requester = require('./requester.js')
const database = require('./database.js')
const web_parser = require('./web_parser')
const PromisePool = require('es6-promise-pool')
const torrent = require('./torrent')

//Interval at which we want to poll nyaa(in seconds)
const interval_seconds = 5*60
const max_concurrent_downloads = 1
let last_visited = {}

function checkNyaa() {
  start_time = getTime()
  list = parser.get_shows()
  visited_map = database.readSync(time_dir)
  list.forEach(show =>{
    mkdir(path.join(video_dir, show['name']))
    if(!(show['name'] in visited_map))
      visited_map[show['name']]=0
    if(visited_map[show['name']]!=0 && !show['ongoing'])
      visited_map[show['name']] = Number.MAX_SAFE_INTEGER
  })

  for(key in visited_map)
    if(key in last_visited)
        visited_map[key]=last_visited[key]
  last_visited = visited_map
  list.forEach(show =>{show['last_checked']=last_visited[show['name']]})
  list = list.filter(show =>{
    return show['last_checked']<Number.MAX_SAFE_INTEGER
  })
  list = list.sort((itemA,itemB)=>(itemA['last_checked']-itemB['last_checked']))
  if(list.length==0){
    console.log("Program Terminating no shows found")
    return
  }

  console.log('Checking Nyaa.si')

  let download_queue = []
  const show = list[0]
  console.log(show['name'])
  const url= 'https://nyaa.si/?f=0&c=1_2&q='+encodeURI(show['query']);
  const polling_promise = new Promise(
    function(resolve, reject) {
      requester.get(url)
        .then((body) => web_parser.parseBody(body, web_parser.nyaa_si, database_dir, show))
        .then((resp) => {
          last_visited[show['name']] = getTime()
          download_queue = resp
          resolve()
        })
        .catch((err) => reject(err))
    }
  );

  const generatePromises = function * (arr) {
    for (let i = 0; i < arr.length; i++) {
      yield torrent(arr[i], path.join(video_dir, arr[i].show_name), database_dir)
    }
  }

  polling_promise.then(()=>{
    pool = new PromisePool(generatePromises(download_queue), max_concurrent_downloads)

    pool.addEventListener('rejected', function (event) {
      console.error('Rejected: ' + event.data.error.message)
    })

    database.writeSync(last_visited, time_dir)
    pool.start()
    .then(() => {
      console.log('Finished Checking nyaa.si')
      try {
        if (global.gc) {global.gc();}
      } catch (e) {
        console.log('node --expose-gc index.js');
      }
      end_time = getTime()
      diff = end_time-start_time
      if(diff>interval_seconds)
        checkNyaa()
      else
        setTimeout(checkNyaa,(interval_seconds-diff)*1000)
    })
  })

}

checkNyaa()
//Run a task every half hour
