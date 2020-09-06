const ffmpeg = require('fluent-ffmpeg');
const path = require('path')
const glob = require("glob")
const fs = require("fs")
const database = require('../database.js')
const {argv} = require('yargs')

if (require.main === module){
  var env = process.env.NODE_ENV || 'development';
  if(argv.prod)
    env = 'production'
  const {root_dir, video_dir, database_dir} = require('../dirs.js').all(env)

  glob(path.join(video_dir,'**/*.'+old_ending), function (er, files) {

    files.forEach((old_path) => {
      transcode_file(old_path, database_dir)
    });
  })
}

const old_ending = 'mkv'
const new_ending = 'mp4'
module.exports.transcode_file = function transcode_file(old_path, database_dir, callback){
  if(!path.basename(old_path).startsWith('[HorribleSubs]'))
    return
  new_path = changeFileEnding(old_path, new_ending)
  subtitle_path = changeFileEnding(old_path, 'ass')
  ffmpeg()
  .input(old_path)
  .output(new_path)
  .outputOptions('-c:v copy')
  .outputOptions('-c:a copy')
  // Encodes subtitles into video file may or may not use
  // .outputOptions('-c:s mov_text')
  .output(subtitle_path)
  .outputOptions('-c:s copy')
  .on('end', function() {
    console.log("Done "+this._outputs[0].target)
    fs.unlinkSync(old_path)
    map = database.readSync(database_dir)
    for (show in map) {
      for(index in map[show]){
        old_filename = map[show][index]['file_name']
        if(old_path.endsWith(old_filename)){
          map[show][index]['file_name'] = path.basename(this._outputs[0].target)
          map[show][index]['subtitle_file_name'] = path.basename(this._outputs[1].target)
          map[show][index]['thumbnail'] = changeFileEnding(path.basename(this._outputs[0].target), 'png')

        }
      }
    }
    database.writeSync(map, database_dir)

    ffmpeg.ffprobe(this._outputs[0].target, (error, metadata) => {
      const halfway = Math.round(metadata.format.duration) / 2
      const fname = metadata.format.filename
      cmd = ffmpeg()
      .input(fname)
      .inputOptions('-ss ' + halfway)
      .outputOptions('-vf')
      .outputOptions('thumbnail=250,scale=480:270')
      .outputOptions('-frames:v 1')
      .output(changeFileEnding(fname, 'png'))
      .on('done', ()=>{
        if(callback)
          callback()
        console.log("Finished extracting thumbnail")
      })
      .run()
    });

  })
  .on('error', function(err) {
    console.log(err)
    console.log(old_path)
  })
  .run()

}

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
