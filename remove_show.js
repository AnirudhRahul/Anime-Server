const rimraf = require("rimraf");
const path = require("path");
const {argv} = require('yargs')


var env = process.env.NODE_ENV || 'development';
if(argv.prod)
  env = 'production'

const {root_dir, video_dir, database_dir} = require('./dirs.js').all(env)

show_to_remove = argv.file

if(!show_to_remove){
  console.log("Must specify file arg")
  return
}

const database = require('./database.js')
files = database.removeSync(show_to_remove, database_dir)
if(files.length>0)
  console.log("DB Entry Deleted")
else
  console.log("Nothing Happened in DB")

const parser = require('./parser.js')
list = parser.get_shows()
query_to_delete = ''
list.forEach((show) => {
  if(show['name']==show_to_remove){
    query_to_delete = show['query']
  }
});
if(query_to_delete.length>0){
  const fs = require('fs')
  fs.readFile('show_list.txt', 'utf8', function(err, data){
      if (err){
        console.log(err)
        return
      }

      lines = data.split('\n');
      output = []
      for(i=0;i<lines.length;i++){
        if(lines[i].trim().endsWith(query_to_delete.trim())){
          console.log("Deleted "+lines[i])
        }
        else{
          output.push(lines[i])
        }
      }

      fs.writeFileSync('show_list.txt', output.join('\n'));
  });
}
remove_files = !(argv.keep_files)
if(remove_files){
  delete_path = path.join(video_dir, show_to_remove)
  rimraf.sync(delete_path)
}
