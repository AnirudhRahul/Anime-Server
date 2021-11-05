const {root_dir, video_dir, database_dir} = require('../dirs.js').all('production')

const Probe = require("../torrent/ffmpeg/probe_video.js")
const Torrent = require("../torrent")

const episode = {
  show_name: "Violet Evergarden Movie",
  episode: "Movie",
  torrent_name: "[Beatrice-Raws] Violet Evergarden the Movie [BDRip 1920x804 HEVC DTSHD]",
  time_downloaded: Math.floor(Date.now()/1000)
}
const path = `/root/prod-data/videos/Violet Evergarden Movie/[Beatrice-Raws] Violet Evergarden the Movie [BDRip 1920x804 HEVC DTSHD]/[Beatrice-Raws] Violet Evergarden the Movie [BDRip 1920x804 HEVC DTSHD].mkv`
Probe.extract_metadata(path)
.then((metadata) => Torrent.process_episode(metadata, episode, database_dir))
.catch((err)=>{
  console.log("Error processing episode")
  console.error(err)
})
