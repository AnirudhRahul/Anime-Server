assert = require('assert');
fs = require('fs');
path = require('path');
YAML = require('js-yaml');

module.exports.get_shows = function(){
  const file = fs.readFileSync(path.join(__dirname,'show_list.yaml'), 'utf8')
  const res = YAML.load(file)
  const output_list = []
  for(const show of Object.keys(res)){
    const item = res[show]
    output_list.push({
      name: show,
      official_name: item.Official_Name || '',
      query: item.Query || '',
      ongoing: item.Ongoing || false,
      tags: item.Tags || [],
      download_latest: item.Download_Latest || 0,
      offset: item.Offset || 0,
    })
  }
  return output_list
}

if (require.main === module) {
    console.log(this.get_shows());
}

function isNumeric(value) {
  return /^\d+$/.test(value)
}

module.exports.add_episode_numbers = function(input){
  assert(input.length>0)
  input.forEach(obj=>{
    assert('torrent_name' in obj)
  })
  //TODO get rid of episode numbers and start using episode names
  //useful for OVAs and movies
  // if(input.length==1){
  //   input[0]['episode']=1
  //   return
  // }

  words = []
  for(let i=0;i<input.length;i++){
    modified = input[i]['torrent_name'].replace(/[^\w\s]/gi," ")
    words.push(modified.split(" "))
  }

  common_words = new Set(words[0].filter(val => words[1].includes(val)))
  for(let i=0;i<input.length;i++){
    input[i]['episode'] = -1
    for(let j=0;j<words[i].length;j++){
      cur_word = words[i][j]
      if(common_words.has(cur_word))
        continue
      else if(isNumeric(cur_word)){
        input[i]['episode'] = parseInt(cur_word, 10)
        break
      }
      else if(cur_word.includes('E')){
        lastE = cur_word.lastIndexOf('E')
        if(lastE == cur_word.length-1)
          continue
        suffix = cur_word.substring(lastE+1)
        if(isNumeric(suffix)){
          input[i]['episode'] = parseInt(suffix, 10)
          break
        }
      }
    }
  }
}
