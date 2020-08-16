const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const request = require('request');

const canLeave = false;

module.exports.download_episode =function(obj, download_dir){
// console.log('Downloading episode '+obj['show_name']+' from '+obj['download_page'])

    const url= obj['download_page']

    retry(url, 150, 10000, function(err, body) {
      //Extract link to thumbnail image if its there
      img_start = body.indexOf('https://i.')
      if(img_start!=-1){
        endings = ['.png','.jpg','.webp','.jpeg']
        s = endings.length;
        for(i =0;i<s;i++)
          endings.push(endings[i].toUpperCase())

        min_index = -1
        min_ending = ''
        endings.forEach(end=>{
          res = body.indexOf(end,img_start)
          if(min_index == -1)
            [min_index,min_ending] = [res,end]
          else if(res!=-1)
            [min_index,min_ending] = [min(min_index,res),end]
        })
        if(min_index!=-1)
          obj['thumbnail_path']=body.substring(img_start, min_index)+min_ending

        console.log(obj['thumbnail_path'])
      }
      const $ = cheerio.load(body);
      obj['magnet_link']=$('a[href^=magnet]')[0].attribs['href']
      console.log(obj['magnet_link'])
    });
// fs.appendFileSync(path.join(download_dir,'history.txt'), '\n'+JSON.stringify(obj));
}

let retry = (function() {
  let count = 0;
  return function(url, max, timeout, next) {
    request(url, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        // console.log('fail');

        if (count++ < max) {
          return setTimeout(function() {
            retry(url, max, timeout, next);
          }, timeout);
        } else {
          console.log("ERRORED!")
          return next(new Error('max retries reached'));
        }
      }

      // console.log('success');
      next(null, body);
    });
  }
})();
