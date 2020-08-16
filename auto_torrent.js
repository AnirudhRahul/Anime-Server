const cron = require("node-cron");
const fs = require("fs");
const path = require('path');
const parse = require('./parse_markup.js')
const cheerio = require('cheerio');
const got = require('got');
const torrent = require('./torrent.js')

function mkdir(dir){
  if (!fs.existsSync(dir))
      fs.mkdirSync(dir)
}

function mkfile(path){
  if (!fs.existsSync(path)) {
    f = fs.openSync(path, 'w')
    fs.writeFileSync(f,'{}')
    fs.closeSync(f)
  }
}

Array.prototype.last = function() {
    return this[this.length - 1];
}

data_dir = "/usr/local/lsws/Example/data/dev"
video_dir = path.join(data_dir,'videos')
img_dir = path.join(data_dir,'images')
all_dirs = [data_dir, video_dir, img_dir]

all_dirs.forEach(dir => {mkdir(dir)});

user_list = path.join('./shows/user_list.txt')

lines = require('fs').readFileSync(user_list, 'utf-8')
    .split('\r\n')
    .filter(Boolean);

console.log(lines)
list = parse(lines)
size = list.length
console.log(list)

list.forEach(item =>{
  mkdir(path.join(video_dir, item['name']))
  mkfile(path.join(video_dir, item['name'], 'history.txt'))
  mkdir(path.join(img_dir, item['name']))
})


function checkNyaa() {
  console.log("Checking Nyaa.si for updates")
  list.forEach(item => {

    dir = path.join(video_dir, item['name'], 'history.txt')
    file = fs.readFileSync(dir, 'utf-8')
    cur_json = file.split("\n")
    for(i = 0; i < cur_json.length; i++)
      cur_json[i] = JSON.parse(cur_json[i])

    const url= 'https://nyaa.si/?f=0&c=1_2&q='+encodeURI(item['query']);
    console.log(url)

    got(url).then(response => {
      resp_json = []
      const $ = cheerio.load(response.body);
      $('tr a[title][class!=comments]').each(function (index, e) {
        if(this.attribs['href'].startsWith('/view/')){
          json_item={
                'show_name':item['name'],
                'file_name':'',
                'time_uploaded':0,
                'download_page':'',
                'ondisk':false,
                'video_path':'',
                'thumbnail_path':'',
                'time_downloaded':0,
          }
          resp_json.push(json_item)
          resp_json.last()['file_name'] = this.attribs['title']
          resp_json.last()['download_page'] = 'nyaa.si' + this.attribs['href']
        }
      });

      ind = 0
      $('td[data-timestamp]').each(function (index, e) {
          resp_json[ind]['time_uploaded'] = parseInt(this.attribs['data-timestamp'])
          ind++
      });
      resp_json.sort(function(itemA, itemB){
        return itemB['time_uploaded']-itemA['time_uploaded']
      })


      if(item['latest_only']){
        //Only grab items that are less than 2 days older than latest release
        max_diff = 2*60*60
        latest_json = [resp_json[0]]
        for(i = 1; i < resp_json.length; i++)
          if(resp_json[0]['time_uploaded']-resp_json[i]['time_uploaded']<max_diff)
            latest_json.push(resp_json[i])
        //Overwrites resp json since we are only checking the latest values
        resp_json = latest_json
      }

      for(j = 0; j < resp_json.length; j++){
        for(i = 0; i < cur_json.length; i++){
          if(resp_json[j]['file_name'] == cur_json[i]['file_name'])
            break;
        }
        torrent.download_episode(resp_json[j])
      }

    }).catch(err => console.log(err));

  });

}



checkNyaa()
//Run a task every half hour
cron.schedule("0 */30 * * * *", checkNyaa);
