const assert = require('assert');
const fs = require('fs');
const path = require('path');
//TODO make this parse new_show_list.txt instead
//The output format is fine though
module.exports.get_shows = function(){
  lines = fs.readFileSync(path.join(__dirname,'show_list.txt'), 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map(s => s.trim())

  out = []
  tags = []
  lines.forEach(line => {
    //Don't parse comments
    if(line.startsWith("#"))
      return
    if(line.startsWith("Tags:")){
      line = line.substring("Tags:".length)
      line = line.trim()
      tags = []
      if(line.length>1){
        tags = line.split(', ')
      }
      return
    }
    latest_only = 0
    while(line.startsWith("~")){
      line = line.substring(1)
      latest_only++
    }
    q = line
    g = q.split('[').pop().split(']')[0];
    rest = q.substring(q.indexOf(']')+1)
    n = rest.trim()
    //Extract the english name if its in parenthesis
    if(rest.includes('(') && rest.includes(')')){
      p = rest.split('(').pop().split(')')[0];
      if (p.length / rest.length > 0.2)
        n=p.trim()
    }
    season = ""
    rest.split(" ").forEach(word =>{
      if(word.length<5){
        word = word.toUpperCase();
        if(word.startsWith('S')){
          if(!isNaN(word.substring(1)))
            season = word
        }
      }
    })
    if(!n.endsWith(season)){
      n+=" - "+season
    }
    ongoing = true
    if(tags.includes("Movie") || tags.includes("Completed"))
      ongoing = false

    out.push({
      'name':n,
      'subtitle_group':g,
      'query':q,
      'latest_only':latest_only,
      'tags':tags,
      'ongoing':ongoing
    })

  })
  return out
}

function isNumeric(value) {
  return /^\d+$/.test(value)
}

//This means it was directly called from command line
if (require.main === module) {
    console.log(this.get_shows());
}

//TODO get rid of episode numbers and start using episode names
//useful for OVAs and movies
module.exports.add_episode_numbers = function(input){
  assert(input.length>0)
  input.forEach(obj=>{
    assert('torrent_name' in obj)
  })

  if(input.length==1){
    input[0]['episode']=1
    return
  }

  words = []
  for(i=0;i<input.length;i++){
    modified = input[i]['torrent_name'].replace(/[^\w\s]/gi," ")
    words.push(modified.split(" "))
  }

  common_words = new Set(words[0].filter(val => words[1].includes(val)))
  for(i=0;i<input.length;i++){
    input[i]['episode'] = -1
    for(j=0;j<words[i].length;j++){
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
        if(isNumeric(suffix))
          input[i]['episode'] = parseInt(suffix, 10)
        break
      }
    }
  }
}
