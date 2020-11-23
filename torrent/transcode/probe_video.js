ffmpeg = require('fluent-ffmpeg');
module.exports.extract_metadata = (video_path) =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(video_path, (error, metadata) => {
      if(error){
        return reject(error)
      }
      else{
        let video_stream = false
        for(stream of metadata.streams)
          if(stream.codec_type=='video'){
            video_stream = stream
            break
          }
        if(!video_stream){
          return reject("No video stream found :(")
        }
        resolve({
          duration: metadata.format.duration,
          file_size: metadata.format.size,
          width: video_stream.width,
          height: video_stream.height,
          video_path: video_path,
          base_path: video_path.split('.').slice(0, -1).join('.'),
          video_codec: video_stream.codec_name,
        })
      }
    })

  })
