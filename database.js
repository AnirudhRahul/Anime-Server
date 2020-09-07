const fs = require("fs");
const assert = require('assert');

module.exports.writeSync =function(json_map, database_dir){
  fs.writeFileSync(database_dir,JSON.stringify(json_map))
}

module.exports.addSync =function(obj, database_dir){
  assert('show_name' in obj)
  json_map = this.readSync(database_dir)
  show = obj['show_name']
  if(!(show in json_map))
    json_map[show]=[]
  for(let i=0;i<json_map[show].length;i++){
    if(json_map[show][i]['torrent_name'] === obj['torrent_name']){
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
  let json_map = this.readSync(database_dir)
  for (show in json_map) {
    for(index in json_map[show]){
      cur = json_map[show][index]
      if(filter(cur))
        json_map[show][index] = replace(cur)
    }
  }
  this.writeSync(json_map, database_dir)
}

module.exports.removeSync =function(show, database_dir){
  json_map = this.readSync(database_dir)
  out = []
  if(show in json_map)
    out = json_map[show]
  json_map[show]=[]
  this.writeSync(json_map, database_dir)
  return out
}


module.exports.readSync =function(database_dir){
return JSON.parse(fs.readFileSync(database_dir,'utf-8'))
}

module.exports.readAsync =function(database_dir, callback){
  fs.readFile(database_dir,'utf-8',function(err, data){
    callback(err, JSON.parse(data))
  })
// return JSON.parse()
}
