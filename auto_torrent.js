const cron = require("node-cron");
const fs = require("fs");
const path = require('path');
const season_sort = require('./sort_seasons.js')
const extract = require('./extract_names.js')
const cheerio = require('cheerio');
const got = require('got');

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
list = [data_dir, video_dir, img_dir]

list.forEach(dir => {mkdir(dir)});

fnames = fs.readdirSync('./seasons')
fnames.sort(season_sort)
cur_season = path.join('./seasons',fnames.last())
query = require('fs').readFileSync(cur_season, 'utf-8')
    .split('\r\n')
    .filter(Boolean);
[sub_group, name_list] = extract(query)

name_list.forEach(name =>{
  mkdir(path.join(video_dir, name))
  mkfile(path.join(video_dir, name, 'history.txt'))
  mkdir(path.join(img_dir, name))
})

size = query.length
function checkNyaa() {
  console.log("Checking Nyaa.si for updates")

  name_list.forEach(name =>{
    console.log(name)
    dir = path.join(video_dir, name, 'history.txt')
    file = fs.readFileSync(dir, 'utf-8')
    json_list = file.split("\n")
    console.log(json_list)
    for(i = 0; i < json_list.length; i++)
      json_list[i] = JSON.parse(json_list[i])
    console.log(json_list)

    new_json = []


  })

}


checkNyaa()
//Run a task every half hour
cron.schedule("0 */30 * * * *", checkNyaa);
