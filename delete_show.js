const database = require('./database.js')
const rimraf = require("rimraf");
const path = require("path");

const env = process.env.NODE_ENV || 'development';
const data_dir = env =='production'?'../prod':'../dev'
video_dir = path.join(data_dir,'videos')
database_dir = path.join(data_dir, 'database.txt')

show_to_remove = "Shokugeki no Soma S5"
remove_files = true
files = database.removeSync(show_to_remove, database_dir)
if(remove_files){
  delete_path = path.join(video_dir, show_to_remove)
  rimraf.sync(delete_path)
}
