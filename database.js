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
  for(i=0;i<json_map[show].length;i++){
    if(json_map[show][i]['file_name'] === obj['file_name']){
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

module.exports.readSync =function(database_dir){
return JSON.parse(fs.readFileSync(database_dir,'utf-8'))
}

module.exports.readAsync =function(database_dir, callback){
  fs.readFile(database_dir,'utf-8',function(err, data){
    callback(err, JSON.parse(data))
  })
// return JSON.parse()
}
