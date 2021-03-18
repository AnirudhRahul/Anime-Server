ffmpeg = require('fluent-ffmpeg');

function extract_subs(metadata){
  return new Promise(function(resolve, reject){

    if(metadata.subtitle_streams.length==0){
      console.log("No Subtitles to Extract")
      return resolve(metadata)
    }

    let cmd = ffmpeg({stdoutLines:1000}).input(metadata.video_path)

    for(const stream of metadata.subtitle_streams){
      cmd.addOutput(metadata.base_path + '_' +stream.file_ending)
      .addOutputOptions(['-map 0:'+ stream.index, '-c copy'])
    }

    cmd.once('end', function(stdout, stderr) {
      console.log("Extracted " + metadata.subtitle_streams.length + " subtitle tracks")
      metadata.subtitle_path = metadata.subtitle_streams.map(stream => ({
        path: metadata.base_path + '_' + stream.file_ending,
        name: stream.title || stream.language || stream.index,
        is_default: stream.is_default,
        language: stream.language
      }))
      delete metadata.subtitle_streams
      return resolve(metadata)
    })
    .once('error', function(err, stdout, stderr) {
      console.error(stderr)
      return reject(err)
    })

    cmd.run()
  })
}

module.exports = extract_subs




if (require.main === module){
  const {argv} = require('yargs')
  let env = process.env.NODE_ENV || 'development';
  if(argv.prod)
    env = 'production'
  const {root_dir, video_dir, database_dir} = require('../../dirs.js').all(env)
  const Probe = require("./probe_video.js")
  const glob = require('glob')
  const path = require('path')

  glob(path.join(video_dir,'**/*'+'.mkv'), function (err, files) {
    for(old_path of files){
      Probe.extract_metadata(old_path)
      .then((metadata)=>extract_subs(metadata))
      .catch(console.error)
      break
    }
  })
}
