const ffmpeg = require('fluent-ffmpeg');
const RAM_LIMIT = 1.5
module.exports.extract = (metadata) =>{
  //Good hueuristic for making sure the process doesnt crash because of ram usage
  let thumbnail_frames = Math.floor(RAM_LIMIT*1.25e8/(metadata.width*metadata.height))
  return new Promise((resolve, reject) => {
      const seekPoint = Math.floor(metadata.duration * 0.75)
      ffmpeg()
      .input(metadata.video_path)
      .inputOptions('-ss ' + seekPoint)
      .outputOptions('-vf')
      .outputOptions('thumbnail=' + thumbnail_frames + ',scale=640:360')
      .outputOptions('-frames:v 1')
      .output(metadata.base_path + '.png')
      .on('end', ()=>{
        console.log("Made thumbnail for " + metadata.video_path)
        metadata.thumbnail_path = metadata.base_path + '.png'
        resolve(metadata)
      })
      .on('error', (err)=>{
        reject(err)
      }).run();
  });


}
