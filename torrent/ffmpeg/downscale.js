ffmpeg = require('fluent-ffmpeg');
const path = require('path');
module.exports.thumbnail = (metadata) =>{
  return new Promise((resolve, reject) => {
      const fname = friendlyName(path.basename(metadata.base_path)) + '_small.png'
      const output_path = path.resolve(__dirname, '..','..','public','thumbnail',fname)
      ffmpeg()
      .input(metadata.thumbnail_path)
      .outputOptions('-vf')
      .outputOptions('scale=480:-1')
      .output(output_path)
      .on('end', ()=>{
        console.log("Downscaled " + metadata.thumbnail_path)
        metadata.small_thumbnail_path = '/thumbnail/' + fname
        return resolve(metadata)
      })
      .on('error', (err, stdout, stderr)=>{
        console.error(stderr)
        return reject(err)
      })
      .run()
  });
}

function friendlyName(filename){
  return filename.replace(/[^a-zA-Z0-9-\[\]()._]/g, '')
}
