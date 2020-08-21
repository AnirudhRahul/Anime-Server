const cron = require("node-cron");
const fs = require("fs");
const path = require('path');
const parser = require('./parser.js')
const assert = require('assert');

function mkdir(dir){
  if (!fs.existsSync(dir))
      fs.mkdirSync(dir)
}

function mkfile(path){
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path,'{}')
  }
}

//Initial Setup
const env = process.env.NODE_ENV || 'development';
const data_dir = env =='production'?'../prod':'../dev'


mkdir(data_dir)
video_dir = path.join(data_dir,'videos')
mkdir(video_dir)
database_dir = path.join(data_dir, 'database.txt')
mkfile(database_dir)


const requester = require('./requester.js')
const torrent = require('./torrent.js')
const database = require('./database.js')
const web_parser = require('./web_parser')
var client = new(require('webtorrent'))()

client.on('error', function (err) {
  if(!err.message.startsWith("Cannot add duplicate torrent"))
    throw err;
})


function checkNyaa() {
  const list = parser.get_shows()
  const size = list.length
  list.forEach(show =>{
    mkdir(path.join(video_dir, show['name']))
  })
  console.log('Checking Nyaa.si for '+size+' shows')

  list.forEach(show => {
    const url= 'https://nyaa.si/?f=0&c=1_2&q='+encodeURI(show['query']);
    requester.get(url,function(err, body) {
      resp_json = web_parser.nyaa_si(body)
      resp_json.forEach(obj =>{
        obj['show_name'] = show['name']
      })

      const required_keys = ['show_name', 'torrent_name', 'file_name', 'magnet_link', 'time_uploaded', 'episode']
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

      cur_json = database.readSync(database_dir)

outer:for(j = 0; j < resp_json.length; j++){
      resp_show = resp_json[j]['show_name']
        if(resp_show in cur_json){
          for(i = 0; i < cur_json[resp_show].length; i++)
            if(resp_json[j]['file_name'] === cur_json[resp_show][i]['file_name'])
              if(cur_json[resp_show][i]['ondisk'])
                continue outer;
        }
        torrent.add_episode(resp_json[j], path.join(video_dir, show['name']), database_dir, client)

      }

    })
  });



}

checkNyaa()
//Run a task every half hour
task = cron.schedule("0 */30 * * * *", checkNyaa)

const sigs = ['SIGINT', 'SIGTERM', 'SIGQUIT']
sigs.forEach(sig => {
  process.on(sig, () => {
    // Stops gracefully
    console.log("\nNode process gracefully terminating")
    task.destroy()
    client.destroy()
  })
})
