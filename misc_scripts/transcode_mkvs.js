const ffmpeg = require('fluent-ffmpeg');
const path = require('path')
const glob = require("glob")
const fs = require("fs")
const database = require('../database.js')
const {argv} = require('yargs')

var env = process.env.NODE_ENV || 'development';
if(argv.prod)
  env = 'production'

const {root_dir, video_dir, database_dir} = require('../dirs.js').all(env)
const old_ending = 'mkv'
const new_ending = 'mp4'

glob(path.join(video_dir,'**/*.'+old_ending), function (er, files) {
  count = 0
  files.forEach((old_path) => {
    if(!path.basename(old_path).startsWith('[HorribleSubs]'))
      return
    // if(count>3)
    //   return
    // count++

    new_path = changeFileEnding(old_path, new_ending)
    subtitle_path = changeFileEnding(old_path, 'vtt')
    command =
    ffmpeg()
    .input(old_path)
    .output(new_path)
    .outputOptions('-c:v copy')
    .outputOptions('-c:a copy')
    .outputOptions('-c:s mov_text')
    .output(subtitle_path)
    .on('end', function() {
      console.log("DONE "+old_path)
      fs.unlinkSync(old_path)
      map = database.readSync(database_dir)
      for (show in map) {
        for(index in map[show]){
          old_filename = map[show][index]['file_name']
          if(old_path.endsWith(old_filename)){
            map[show][index]['file_name'] = changeFileEnding(old_filename, new_ending)
            map[show][index]['subtitle_file_name'] = path.basename(subtitle_path)
          }
        }
      }
      database.writeSync(map, database_dir)
    })
    .on('error', function(err) {
      console.log(err)
      console.log(old_path)
    })
    .run()

  });
})


function changeFileEnding(input, new_ending){
    return input.substring(0,input.lastIndexOf('.')+1)+new_ending
}
// var command =
// ffmpeg('../dev/videos/One Piece [1080p]/[HorribleSubs] One Piece - 936 [1080p].mkv')
// .output('../dev/videos/One Piece [1080p]/[HorribleSubs] One Piece - 936 [1080p].mp4')
// .on('end', function() {
//   console.log('Finished processing');
// })
// .run()
