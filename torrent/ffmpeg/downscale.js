ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// Downscales thumbnail to a standard 480 x 270
module.exports.thumbnail = (metadata) =>{
  const fname = friendlyName(path.basename(metadata.base_path)) + '_small.avif'
  const output_path = path.resolve(__dirname, '..','..','public','thumbnail',fname)
  return sharp(metadata.thumbnail_path)
    .resize({
      width: 480,
      height: 270,
      fit: sharp.fit.cover,
      position: sharp.strategy.entropy
    })
    .toFile(output_path)
    .then(info => {
      const bytes = info.size || 0
      console.log("Downscaled " + metadata.thumbnail_path + " " + bytes/1024 + "Kb")
      metadata.small_thumbnail_path = path.join('/thumbnail', fname);
      return metadata
    })
}

function friendlyName(filename){
  return filename.replace(/[^a-zA-Z0-9-\[\]()._]/g, '')
}
