const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const WebTorrent = require('webtorrent')
const database = require('./database.js')
const requester = require('./requester.js')

const canLeave = false;

module.exports.download_episode =function(obj, download_dir, database_dir, max_size_bytes){
// console.log('Downloading episode '+obj['show_name']+' from '+obj['download_page'])
  return new Promise((resolve, reject) =>{
      const url= obj['download_page']
      requester.get(url, function(err, body) {
        //Extract link to thumbnail image if its there
        getImage(body, obj)
        const $ = cheerio.load(body);
        magnet_link=$('a[href^=magnet]')[0].attribs['href']
        console.log('Downloading: '+obj['show_name']+" - "+obj['episode'])
        database.addSync(obj,database_dir)

        var client = new WebTorrent()
        // console.log("Progress: "+client.progress)
        // for(i=0;i<10;i++)
        client.add(magnet_link, { path: download_dir }, function (torrent) {
          console.log("Length(Bytes): "+torrent['length'])
          if(torrent['length'] > max_size_bytes){
            torrent.destroy()
            console.log("TOO LONG DESTROYED: "+obj['show_name']+" - "+obj['episode'])
          }
          torrent.on('done', () => {
            // console.log(torrent.files[0])
            console.log("FINISHED: "+obj['show_name']+" - "+obj['episode'])
            obj['video_path'] = path.join(download_dir, torrent.files[0]['name'])
            obj['ondisk'] = true
            obj['size'] = torrent.files[0]['length']
            obj['time_downloaded'] = Math.floor(new Date().getTime() / 1000)
            database.addSync(obj,database_dir)
            resolve()
          })
          torrent.on('error', () => {
            console.log("ERRORED: "+obj['show_name']+" - "+obj['episode'])
          })
        })


      });

    });
}

function getImage(body, obj){
  img_start = body.indexOf('https://i.')
  min_index = -1
  if(img_start!=-1){
    endings = ['.png','.jpg','.webp','.jpeg']
    s = endings.length;
    for(i =0;i<s;i++)
      endings.push(endings[i].toUpperCase())

    min_ending = ''
    endings.forEach(end=>{
      res = body.indexOf(end,img_start)
      if(min_index == -1)
        [min_index,min_ending] = [res,end]
      else if(res!=-1)
        [min_index,min_ending] = [min(min_index,res),end]
    })
  }
  if(min_index!=-1)
    obj['thumbnail_link']=body.substring(img_start, min_index)+min_ending
}
