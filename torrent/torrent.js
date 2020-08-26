const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const database = require('../database.js')
const requester = require('../requester.js')

const canLeave = false;

max_size_bytes = 4*1e9

module.exports.add_episode =function(obj, download_dir, database_dir, client){
  client.add(obj['magnet_link'], { path: download_dir }, function (torrent) {
    const desc = obj['show_name']+" - "+obj['episode']

    console.log('Downloading: ' + desc)
    console.log("Length(Bytes): "+torrent['length'])
    //Double limit for first episode
    mult = obj['episode']==1? 2:1
    if(torrent['length'] > max_size_bytes*mult){
      torrent.destroy()
      console.log("TOO LONG DESTROYED: " + desc)
    }
    if(torrent.files.length>1){
      torrent.destroy()
      console.log("TOO MANY FILES DESTROYED: " + desc)
    }

    torrent.on('done', () => {
      // console.log(torrent.files[0])
      console.log("FINISHED: "+obj['show_name']+" - "+obj['episode'])
      obj['video_path'] = path.join(download_dir, torrent.files[0]['name'])
      obj['ondisk'] = true
      //Don't need magnet link anymore
      delete obj['magnet_link']
      obj['size'] = torrent.files[0]['length']
      obj['time_downloaded'] = Math.floor(new Date().getTime() / 1000)
      database.addSync(obj,database_dir)
    })
    torrent.on('error', () => {
      console.log("ERRORED: "+obj['show_name']+" - "+obj['episode'])
    })
  })


  }
