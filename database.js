const fs = require("fs");
const assert = require('assert');

module.exports.writeSync =function(json_map, database_dir){
  fs.writeFileSync(database_dir,JSON.stringify(json_map))
}

module.exports.addSync =function(obj, database_dir){
  assert('show_name' in obj)
  const json_map = this.readSync(database_dir)
  const show = obj.show_name
  if(!(show in json_map))
    json_map[show]=[]
  for(let i=0;i<json_map[show].length;i++){
    if(json_map[show][i].torrent_name === obj.torrent_name && json_map[show][i].episode === obj.episode){
      json_map[show][i] = obj
      this.writeSync(json_map, database_dir)
      return
    }
  }
  json_map[show].push(obj)
  json_map[show].sort((itemA,itemB)=>{
    return itemB['time_uploaded']-itemA['time_uploaded']
  })
  this.writeSync(json_map, database_dir)
  // fs.writeSync(database_dir,JSON.stringify(json_map))
}

module.exports.select_and_replace = function(filter, replace, database_dir){
  const json_map = this.readSync(database_dir)
  for (show in json_map) {
    for(index in json_map[show]){
      cur = json_map[show][index]
      if(filter(cur))
        json_map[show][index] = replace(cur)
    }
  }
  this.writeSync(json_map, database_dir)
}

module.exports.filter = function(map_filter, database_dir){
  const json_map = this.readSync(database_dir)
  for (show in json_map) {
    for(index in json_map[show]){
      json_map[show] = json_map[show].filter(map_filter)
    }
  }
  this.writeSync(json_map, database_dir)
}

module.exports.removeSync =function(show, database_dir){
  const json_map = this.readSync(database_dir)
  out = []
  if(show in json_map)
    out = json_map[show]
  json_map[show]=[]
  this.writeSync(json_map, database_dir)
  return out
}

function readSync(database_dir){
return JSON.parse(fs.readFileSync(database_dir,'utf-8'))
}
module.exports.readSync = readSync;

module.exports.filter_downloaded_torrents = function(resp_json, show, database_dir){
  if(show.type == 'Batch' || show.type == 'Movie'){
    assert(resp_json.length==1)
    const db_json = readSync(database_dir)
    if(show.name in db_json)
      for(const episode of db_json[show.name]){
        // Return empty list if batch is already downloaded
        if(resp_json[0].magnet_hash == episode.metadata.magnet_hash)
          return []
      }
    return resp_json
  }
  if(show.type == 'Series'){
    if(show.download_latest!=0 && resp_json.length>1){
      //1 day in seconds
      const max_diff = 1*60*60
      const latest_json = []
      let index = 0
      for(let weeks = 0; weeks<show.download_latest && index<resp_json.length; weeks++){
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

    const db_json = readSync(database_dir)
    const missing_episodes = new Set()
    for(let j = 0; j < resp_json.length; j++){
        let found = false
        if(show.name in db_json)
          for(let i = 0; i < db_json[show.name].length; i++)
            if(resp_json[j].episode === db_json[show.name][i].episode && 'time_downloaded' in db_json[show.name][i]){
                found = true
                break
            }
        if(!found)
          missing_episodes.add(resp_json[j].episode)
    }
    console.log("Missing Episodes")
    console.log(missing_episodes)
    const toDownload = []
    for(item of resp_json){
      if(missing_episodes.has(item.episode)){
        item.show_name = show.name
        toDownload.push(item)
        missing_episodes.delete(item.episode)
      }
    }
    return toDownload
  }
}
