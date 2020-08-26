const path = require('path')
const glob = require("glob")
const fs = require("fs")
const database = require('../database.js')
const {argv} = require('yargs')

var env = process.env.NODE_ENV || 'development';
if(argv.prod)
  env = 'production'

const {root_dir, video_dir, database_dir} = require('../dirs.js').all(env)

old_ending = 'mkv'
new_ending = 'webm'
glob(path.join(video_dir,'**/*.'+old_ending), function (er, files) {
  files.forEach((old_path) => {
    new_path = old_path.substring(0,old_path.length-old_ending.length)+new_ending
    fs.rename(old_path, new_path,()=>{})
    console.log(new_path)
  });
})

map = database.readSync(database_dir)

for (show in map) {
  for(index in map[show]){
    old_path = map[show][index]['file_name']
    if(old_path.endsWith(old_ending)){
      new_path = old_path.substring(0,old_path.length-old_ending.length)+new_ending
      console.log(new_path)
      map[show][index]['file_name']=new_path
    }
  }
}
database.writeSync(map, database_dir)
