ffmpeg = require('fluent-ffmpeg');
const fs = require("fs")

function transcode_file(metadata){
  return new Promise(function(resolve, reject){
    const new_video_path = metadata.base_path + '.mp4'
    // const subtitle_path = metadata.base_path + '.ass'
    // Converts non mp4 file to an mp4 if codec is compatible
    ffmpeg().input(metadata.video_path)
    .output(new_video_path)
    .outputOptions('-c:v copy')
    // .outputOptions('-c:a copy')
    // .output(subtitle_path)
    // .outputOptions('-c:s copy')
    .on('end', function() {
      //Delete old untranscoded file
      fs.unlinkSync(metadata.video_path)
      metadata.transcoded = true
      metadata.video_path = new_video_path
      console.log("Transcoded to " + metadata.video_path)

      ffmpeg.ffprobe(metadata.video_path, (err, new_metadata) => {
        if(err) reject(err)
        metadata.duration = new_metadata.format.duration;
        metadata.file_size = new_metadata.format.size;
        return resolve(metadata)
      })
      // metadata.subtitle_path = subtitle_path
    })
    .on('error', function(err, stdout, stderr) {
      console.error(stderr)
      return reject(err)
    })
    .run()
  })
}
module.exports.transcode_file = transcode_file




if (require.main === module){
  const {argv} = require('yargs')
  let env = process.env.NODE_ENV || 'development';
  if(argv.prod)
    env = 'production'
  const {root_dir, video_dir, database_dir} = require('../../dirs.js').all(env)
  const Probe = require("./probe_video.js")
  const glob = require('glob')
  const path = require('path')

  glob(path.join(video_dir,'**/*'+'.mkv'), function (er, files) {

    files.forEach((old_path) => {
      Probe.extract_metadata(old_path)
      .then((metadata)=>transcode_file(metadata))
    });
  })
}
