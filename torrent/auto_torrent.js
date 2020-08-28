const fs = require("fs");
const path = require('path');
const parser = require('../parser.js')
const assert = require('assert');
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
const {root_dir, video_dir, database_dir} = require('../dirs.js').all(env)
mkdir(root_dir)
mkdir(video_dir)
mkfile(database_dir)
console.log(database_dir)

const requester = require('../requester.js')
const download = require('./download.js')
const database = require('../database.js')
const web_parser = require('../web_parser')
const PromisePool = require('es6-promise-pool')
//Interval at which we want to poll nyaa(in minutes)
const interval_seconds = 1*60
const max_concurrent_downloads = 2
function checkNyaa() {
  start_time = getTime()
  list = parser.get_shows()
  const size = list.length
  list.forEach(show =>{
    mkdir(path.join(video_dir, show['name']))
  })
  console.log('Checking Nyaa.si for '+size+' shows')
  show_queue = []
  promise_list = []
  list.forEach(show => {
    const url= 'https://nyaa.si/?f=0&c=1_2&q='+encodeURI(show['query']);
    promise = requester.get(url)
    promise_list.push(promise)
    promise.then((body) => {
      resp_json = web_parser.nyaa_si(body)
      resp_json.forEach(obj =>{
        obj['show_name'] = show['name']
      })

      const required_keys = ['show_name', 'torrent_name', 'magnet_link', 'time_uploaded', 'episode']
      resp_json.forEach(obj =>{
        required_keys.forEach(key =>{
          assert(key in obj)
        })
      })

      resp_json.sort(function(itemA, itemB){
        return itemB['time_uploaded']-itemA['time_uploaded']
      })

      if(show['latest_only']!=0 && resp_json.length>1){
        //1 day in seconds
        max_diff = 1*60*60
        latest_json = []
        index = 0
        for(weeks = 0; weeks<show['latest_only'] && index<resp_json.length; weeks++){
          latest_json.push(resp_json[index])
          last = resp_json[index]
          index++
          while(index < resp_json.length)
            if(last['time_uploaded']-resp_json[index]['time_uploaded']<max_diff){
              latest_json.push(resp_json[index])
              index++
            }
            else{
              break
            }
        }
        //Overwrites resp json since we are only want the latest values
        resp_json = latest_json
      }
      // console.log(resp_json)

      cur_json = database.readSync(database_dir)

outer:for(j = 0; j < resp_json.length; j++){
      resp_show = resp_json[j]['show_name']
        if(resp_show in cur_json){
          for(i = 0; i < cur_json[resp_show].length; i++)
            if(resp_json[j]['torrent_name'] === cur_json[resp_show][i]['torrent_name'])
              if(cur_json[resp_show][i]['ondisk'])
                continue outer;
        }
        //Testing for memory leak
        show_queue.push(resp_json[j])
        // download.download(resp_json[j], path.join(video_dir, show['name']), database_dir)

      }

    }).catch((err)=>{
      console.log(err)
    })
  });

  const generatePromises = function * (arr) {
    for (i = 0; i < arr.length; i++) {
      yield download(arr[i], path.join(video_dir, arr[i]['show_name']), database_dir)
    }
  }

  Promise.all(promise_list).then(()=>{


    pool = new PromisePool(generatePromises(show_queue), max_concurrent_downloads)

    pool.start()
    .then(() =>{
       end_time = getTime()
       diff = end_time-start_time
       if(diff>interval_seconds)
        checkNyaa()
       else
        setTimeout(checkNyaa,(interval_seconds-diff)*1000)
       console.log('Completed all downloads')
     })
  })
}

checkNyaa()
//Run a task every half hour

// const sigs = ['SIGINT', 'SIGTERM', 'SIGQUIT']
// sigs.forEach(sig => {
//   process.on(sig, () => {
//     // Stops gracefully
//     console.log("\nNode process gracefully terminating")
//     task.destroy()
//     process.exit()
//   })
// })
