const path = require('path')
const rimraf = require("rimraf");
const DownloadTorrent = require('./download_torrent.js')
const Probe = require("./ffmpeg/probe_video.js")
const Thumbnail = require("./ffmpeg/extract_thumbnail.js")
const Downscale = require("./ffmpeg/downscale.js")
const ExtractSubs = require("./ffmpeg/extract_subs.js")
const TranscodeVideo = require("./ffmpeg/transcode_video.js")
const ObjectStorage = require("./object-storage")
const title_parser = require('../title_parser.js')

// Helps stagger promises so RAM doesn't get destroyed
const PromiseLimit = require('p-limit')
const max_concurrent_downloads = 1
const max_concurrent_transcodes = 2


module.exports.series = (episode_list, show, database_dir) => {
  const limit = PromiseLimit(max_concurrent_downloads)
  const promise_list = episode_list.map(episode => {
    return limit(() =>torrent_episode(episode, show, database_dir))
  })
  return Promise.all(promise_list)
}

// Returns a promise that resolves when the inputted object
// is done being downloaded, transcoded, and sent to S3
// Should resolve with the modified value of the input obj
// Assumes torrent only contains 1 main file we care about
function torrent_episode(episode, show, database_dir){
  if(!('magnet_link' in episode)){
    throw new Error('Magnet Link is not in input Object!!!\n'+episode)
  }
  return DownloadTorrent(episode.magnet_link, show.path, 1)
  .then((torrent) => {
    // Only downloads the torrent if it has 1 file, so we don't accidently pick up batches
    let mainFile = torrent.files[0]
    episode.episode = title_parser.parse(mainFile.name, show)
    episode.time_downloaded = Math.floor(Date.now()/1000)
    // Return video metadata to inform future promises
    return Probe.extract_metadata(path.join(torrent.path, mainFile.path))
  })
  .then((metadata) => process_episode(metadata, episode, database_dir))
  .catch((err) =>{
    if(err.toString() === "Too many files in torrent"){
      console.log("Skipped batch file")
    }
    else
      console.error(err)
  })
}

function process_episode(initial_metadata, episode, database_dir){
  return Thumbnail.extract(initial_metadata)
  .then((metadata) => Downscale.thumbnail(metadata))
  .then((metadata) => {
    metadata.transcoded = false
    if(metadata.video_codec == 'h264' && !metadata.video_path.endsWith('.mp4')){
      return ExtractSubs(metadata)
             .then((metadata) => TranscodeVideo.transcode_file(metadata))
    }
    else
      return metadata
  })
  .then((metadata) => {
    //Adding hash of magnet link to metadata
    //before we send it to ObjectStorage
    metadata.magnet_hash = episode.magnet_hash
    delete episode.magnet_link
    delete episode.magnet_hash
    console.log("STARTING UPLOAD")
    return updateDatabase(episode, metadata, database_dir)
  })
  .then((metadata) => ObjectStorage.upload(metadata))
  .then((metadata) => updateDatabase(episode, metadata, database_dir))
  .then((metadata) => {
      console.log("Finished Torrent promise")
      // console.log("FINAL METADATA")
      // console.log(metadata)
  })

}

function SlashCountAscend(strA, strB){
  let countA = 0
  let countB = 0
  for(let i=0; i<strA.length; i++){
    if(strA[i]=='/')
      countA+=1
  }
  for(let i=0; i<strB.length; i++){
    if(strB[i]=='/')
      countB+=1
  }
  return countA - countB
}
function SlashCountDescend(strA, strB){
  return -SlashCountAscend(strA, strB)
}

module.exports.batch = (batch, show, database_dir) => {
  if(!('magnet_link' in batch)){
    throw new Error('Magnet Link is not in input Object!!!\n'+batch)
  }

  console.log("Downloading batch", show.name, "...")
  // Keep track of folder indices
  for(let index in show.format){
    show.format[index].index = index
    // Remove trailing slashes
    show.format[index].Folder = show.format[index].Folder.replace(/\/+$/, "");
  }

  //Put the more specific longer paths at the front
  show.format.sort((formatA, formatB) => SlashCountDescend(formatA.Folder, formatB.Folder))

  return DownloadTorrent(batch.magnet_link, show.path)
  .then((torrent) => {
    batch.time_downloaded = Math.floor(Date.now()/1000)

    // Object that groups all files in the same folder into a list
    // Key is folder name
    let torrent_folders = {}
    for(let index in torrent.files){
      // Use dirname to dump filename and only get folder name
      const folder_path = path.dirname(torrent.files[index].path)
      if(folder_path in torrent_folders){
        torrent_folders[folder_path].push(index)
      }
      else{
        torrent_folders[folder_path]=[index]
      }
    }

    // Sort files in folder by filename
    for(const key in torrent_folders){
      torrent_folders[key].sort((indexA, indexB) => torrent.files[indexA].name.localeCompare(torrent.files[indexB].name))
    }

    const torrent_folder_keys = Object.keys(torrent_folders)

    // Sort to put shorter less specific paths first
    torrent_folder_keys.sort(SlashCountAscend)

    const episode_list = []
    const episode_name_set = new Set()
    const matched_indices = new Set()
    for(const torrent_folder_path of torrent_folder_keys){
      let matched = false
      for(const format_index in show.format){
        if(format_index in matched_indices){
          continue
        }
        const folder_format = show.format[format_index]
        if(torrent_folder_path.endsWith(folder_format.Folder)){
          matched_indices.add(format_index)
          matched = true
          show.query = folder_format.Episode
          console.log("Query", show.query || folder_format.Episode_names)

          let orderIndex = 0
          // Loop over all files in folder
          // Torrent folders is just a list of indices though
          for(const torrent_index of torrent_folders[torrent_folder_path]){
            const torrent_file = torrent.files[torrent_index]
            let episode_name = ''
            if(folder_format.Episode_names){
              episode_name = folder_format.Episode_names[torrent_index]
            }
            else{
              episode_name = title_parser.parse(torrent_file.name, show)
            }
            //Make sure there are no duplicate episode names
            if(episode_name in episode_name_set){
              episode_name = torrent_file.name
            }
            episode_name_set.add(episode_name)
            episode_list.push({
              video_path: path.join(torrent.path, torrent_file.path),
              episode:{
                magnet_hash: batch.magnet_hash,
                // name: torrent_file.name,
                show_name: show.name,
                episode: episode_name,
                time_uploaded: batch.time_uploaded,
                time_downloaded: batch.time_downloaded,
                season_index: parseInt(folder_format.index),
                episode_index: orderIndex
              }
            })
            // Tracks the chronologically order of episodes in folder
            orderIndex+=1
          }
          // Each folder should only match to one entry in show.format
          break
        }
      }
      if(!matched){
        console.log("WARNING")
        console.log(torrent_folder_path)
        console.log("Was not matched to an entry in the batch's Format, so it will be ignored")
      }
    }

    episode_list.sort((episodeA, episodeB) =>{
      if(episodeA.season_index == episodeB.season_index){
        return episodeA.episode_index - episodeB.episode_index
      }
      else{
        return episodeA.season_index - episodeB.season_index
      }
    })

    for(let i in episode_list){
      episode_list[i].episode.time_downloaded+=i
      episode_list[i].episode.time_uploaded+=i
    }
    torrent_folders = undefined

    const limit = PromiseLimit(max_concurrent_transcodes)
    const promise_list = episode_list.map(item => {
      return limit(() =>
        Probe.extract_metadata(item.video_path)
        .then((metadata) => process_episode(metadata, item.episode, database_dir))
      )
    })
    return Promise.all(promise_list).then(()=>{
      console.log("DELETING TORRENT")
      rimraf.sync(show.path)
    })
  })

}

const database = require('../database.js')
function updateDatabase(obj, metadata, database_dir){
  console.log("Updated DB")
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
