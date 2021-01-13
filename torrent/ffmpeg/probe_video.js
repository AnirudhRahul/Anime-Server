ffmpeg = require('fluent-ffmpeg');
module.exports.extract_metadata = (video_path) =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(video_path, (error, metadata) => {
      if(error){
        return reject(error)
      }
      else{
        let video_stream_count = 0
        for(const stream of metadata.streams){
          if(stream.codec_type=='video'){
            video_stream_count+=1
          }
        }
        if(video_stream_count!=1){
          return reject(new Error("File has "+video_stream_count+" streams, should have 1"))
        }

        let video_stream = null
        const subtitle_streams = []

        for(const stream of metadata.streams){
          // Get video stream (there can only be 1 because of previous check)
          if(stream.codec_type=='video'){
            video_stream = stream
          }
          // Extracts all subtitle streams from file
          else if(stream.codec_type=='subtitle'){
            subtitle_streams.push({
              title: stream.tags?.title,
              language: stream.tags?.language,
              is_default: stream?.disposition?.default==1,
              index: stream.index,
              // Guarenteed unique identifier for track
              file_ending: (stream.tags.title || stream.index) + '.' + stream.codec_name
            })
          }
        }

        return resolve({
          duration: metadata.format.duration,
          file_size: metadata.format.size,
          width: video_stream.width,
          height: video_stream.height,
          video_path: video_path,
          base_path: video_path.split('.').slice(0, -1).join('.'),
          video_codec: video_stream.codec_name,
          subtitle_streams: subtitle_streams
        })
      }
    })

  })
