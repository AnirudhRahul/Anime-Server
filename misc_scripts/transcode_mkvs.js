const ffmpeg = require('fluent-ffmpeg');
const path = require('path')
const glob = require("glob")
const fs = require("fs")
const assert = require("assert")
const database = require('../database.js')
const {argv} = require('yargs')

if (require.main === module){
  var env = process.env.NODE_ENV || 'development';
  if(argv.prod)
    env = 'production'
  const {root_dir, video_dir, database_dir} = require('../dirs.js').all(env)

  glob(path.join(video_dir,'**/*'+'.mkv'), function (er, files) {

    files.forEach((old_path) => {
      transcode_file(old_path, database_dir)
    });
  })
}

module.exports.transcode_file = function transcode_file(old_path, database_dir, callback){
  if(!path.basename(old_path).startsWith('[HorribleSubs]'))
    return
  new_path = changeFileEnding(old_path, '.mp4')
  subtitle_path = changeFileEnding(old_path, '.ass')
  ffmpeg()
  .input(old_path)
  .output(new_path)
  .outputOptions('-c:v copy')
  .outputOptions('-c:a copy')
  .output(subtitle_path)
  .outputOptions('-c:s copy')
  .on('end', function() {
    fs.unlinkSync(this._inputs[0].source)
    map = database.readSync(database_dir)
    for (show in map) {
      for(index in map[show]){
        old_filename = map[show][index]['basename']+map[show][index]['video_ext']
        if(old_path.endsWith(old_filename)){
          cur = map[show][index]
          cur['subtitle_ext'] = '.ass'
          cur['thumbnail_ext'] = '.png'
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
      .output(changeFileEnding(fname, '.png'))
      .on('end', ()=>{
        console.log("Finished Processing "+path.basename(this._outputs[0].target))
        if(callback)
          callback()
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
    assert(new_ending.startsWith('.'))
    return input.substring(0,input.lastIndexOf('.'))+new_ending
}
