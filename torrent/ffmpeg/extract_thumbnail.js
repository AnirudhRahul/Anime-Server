ffmpeg = require('fluent-ffmpeg');
const RAM_LIMIT = 1.5
function extract(metadata, seekFraction=0.75){
  //Good hueuristic for making sure the process doesnt crash because of ram usage
  const thumbnail_frames = Math.floor(RAM_LIMIT*1.25e8/(metadata.width*metadata.height))
  return new Promise((resolve, reject) => {
      const seekPoint = Math.floor(metadata.duration * seekFraction)
      ffmpeg()
      .input(metadata.video_path)
      .inputOptions('-ss ' + seekPoint)
      .outputOptions('-vf')
      .outputOptions('thumbnail=' + thumbnail_frames)
      .outputOptions('-frames:v 1')
      .output(metadata.base_path + '.png')
      .on('end', (stdout, stderr)=>{
        if(stderr.includes("Output file is empty, nothing was encoded (check -ss / -t / -frames parameters if used)")){
          if(seekPoint==0){
            return reject("VIDEO: "+metadata.video_path+" is likely corrupted")
          }
          else if(seekPoint>0){
            return resolve(extract(metadata, 0))
          }
        }
        console.log("Made thumbnail for " + metadata.video_path)
        metadata.thumbnail_path = metadata.base_path + '.png'
        return resolve(metadata)
      })
      .on('error', (err, stdout, stderr)=>{
        console.error(stderr)
        return reject(err)
      }).run();
  });
}
module.exports.extract = extract;
