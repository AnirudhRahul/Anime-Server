const cron = require("node-cron");
const fs = require("fs");
const path = require('path');
const parser = require('./parser.js')
const cheerio = require('cheerio');
const requester = require('./requester.js')
const torrent = require('./torrent.js')
const database = require('./database.js')

function mkdir(dir){
  if (!fs.existsSync(dir))
      fs.mkdirSync(dir)
}

function mkfile(path){
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path,'{}')
  }
}

Array.prototype.last = function() {
    return this[this.length - 1];
}

data_dir = process.env.DOWNLOAD_DIR || "/usr/local/lsws/Example/data/dev"
mkdir(data_dir)
video_dir = path.join(data_dir,'videos')
mkdir(video_dir)
database_dir = path.join(data_dir, 'database.txt')
mkfile(database_dir)


user_list = path.join('./shows/user_list.txt')

lines = fs.readFileSync(user_list, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(s => s.trim())

list = parser.parse_markup(lines)
size = list.length

list.forEach(item =>{
  mkdir(path.join(video_dir, item['name']))
})

console.log('Completed Initial Setup')

function checkNyaa() {
  console.log("Checking Nyaa.si for updates")
  console.log('Checking for '+size+' shows')

  list.forEach(item => {
    const url= 'https://nyaa.si/?f=0&c=1_2&q='+encodeURI(item['query']);
    requester.get(url,function(err, body) {
      resp_json = []
      const $ = cheerio.load(body);
      $('tr a[title][class!=comments]').each(function (index, e) {
        if(this.attribs['href'].startsWith('/view/')){
          json_item={
                'show_name':item['name'],
                'file_name':this.attribs['title'],
                'time_uploaded':0,
                'download_page':'https://nyaa.si' + this.attribs['href'],
                'ondisk':false,
          }
          resp_json.push(json_item)
        }
      });
      if(resp_json.length==0)
        return

      ind = 0
      $('td[data-timestamp]').each(function (index, e) {
          resp_json[ind]['time_uploaded'] = parseInt(this.attribs['data-timestamp'])
          ind++
      })

      parser.add_episode_numbers(resp_json)

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


      cur_json = database.readSync(database_dir)

outer:for(j = 0; j < resp_json.length; j++){
      resp_show = resp_json[j]['show_name']
        if(resp_show in cur_json){
          for(i = 0; i < cur_json[resp_show].length; i++)
            if(resp_json[j]['file_name'] === cur_json[resp_show][i]['file_name'])
              if(cur_json[resp_show][i]['ondisk'])
                continue outer;
        }
        torrent.download_episode(resp_json[j], path.join(video_dir, item['name']), database_dir)
      }

    })
  });



}



checkNyaa()
//Run a task every half hour
cron.schedule("0 */30 * * * *", checkNyaa);
