const database = require('./database.js')
const rimraf = require("rimraf");
const path = require("path");
const {argv} = require('yargs')


var env = process.env.NODE_ENV || 'development';
if(argv.prod)
  env = 'production'

const {root_dir, video_dir, database_dir} = require('./dirs.js').all(env)

show_to_remove = argv.file
remove_files = true
files = database.removeSync(show_to_remove, database_dir)
if(files.length>0){
  console.log("Entry Deleted")
}
else {
  console.log("Nothing Happened")
}
if(remove_files){
  delete_path = path.join(video_dir, show_to_remove)
  rimraf.sync(delete_path)
}
