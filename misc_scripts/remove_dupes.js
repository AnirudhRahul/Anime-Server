const path = require("path");
const {argv} = require('yargs')
const glob = require('glob')
const fs = require('fs')

var env = process.env.NODE_ENV || 'development';
if(argv.prod)
  env = 'production'

const {root_dir, video_dir, database_dir} = require('../dirs.js').all(env)



const database = require('../database.js')
glob(path.join(video_dir,'**/*'), function (er, files) {
  for(file of files){
    if(file.toString().includes('720p')){
      console.log(file)
      remove_file(file)
    }
  }

})

function remove_file(file_path){
  fs.unlinkSync(file_path)
  database.filter(
    (obj)=> !file_path.toString().includes(obj['basename']),
    database_dir
  )
}
