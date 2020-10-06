const path = require('path')
const Download = require('./download_torrent.js')
const Probe = require("./transcode/probe_video.js")
const Thumbnail = require("./transcode/extract_thumbnail.js")
const Transcoder = require("./transcode/transcode_video.js")
const ObjectStorage = require("./object-storage")

// Returns a promise that resolves when the inputted object
// is done being downloaded, transcoded, and sent to S3
// Should resolve with the modified value of the input obj
module.exports = (obj, downloadPath, database_dir) =>
 new Promise((resolve, reject) => {
  if(!('magnet_link' in obj))
    reject('Magnet Link is not in input Object!!!\n'+obj)
  Download(obj.magnet_link, downloadPath)
  .then((torrent) => {
    let mainFile = torrent.files[0]
    for(file of torrent.files){
      if(file.length > mainFile.length)
        mainFile = file
    }
    // Store data about video file into obj
    obj.time_downloaded = Math.floor(new Date().getTime() / 1000)
    // Return video metadata to inform future promises
    return Probe.extract_metadata(path.join(torrent.path, mainFile['name']))
  })
  .then((metadata) => Thumbnail.extract(metadata))
  .then((metadata) => {
    metadata.transcoded = false
    if(metadata.video_codec == 'h264' && !metadata.video_path.endsWith('.mp4'))
      return Transcoder.transcode_file(metadata)
    else
      return metadata
  })
  .then((metadata) => {
    //Adding hash of magnet link to metadata
    //before we send it to ObjectStorage
    metadata.magnet_hash = hash(obj.magnet_link)
    delete obj.magnet_link
    return updateDatabase(obj, metadata, database_dir)
  })
  .then((metadata) => ObjectStorage.upload(metadata))
  .then((metadata) => updateDatabase(obj, metadata, database_dir))
  .then(() => {
      console.log("Finished Torrent promise")
      resolve(obj)
  })
  .catch(reject)
});

const database = require('../database.js')
function updateDatabase(obj, metadata, database_dir){
  obj.metadata = metadata
  database.addSync(obj,database_dir)
  return metadata
}

const crypto = require('crypto')
function hash(string){
  return crypto.createHash("sha256")
          .update(string)
          .digest("base64");
}
