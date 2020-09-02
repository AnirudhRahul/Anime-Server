const assert = require('assert');
const fs = require('fs');
const path = require('path');

module.exports.get_shows = function(){
  lines = fs.readFileSync(path.join(__dirname,'show_list.txt'), 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map(s => s.trim())

  //initial values of attributes
  init = {
    "name":"",
    "query":"",
    "ongoing":false,
    "tags":[],
    "download_latest":0,
    "stream":0,
    "offset":0
  }

  curr_attr = {}
  //Deep copy init map
  for(i in init)
    curr_attr[i] = init[i]

  out = []
  lines.forEach(line => {

    //Don't parse comments
    if(line.startsWith("#")){
      return
    }

    //new show name
    if(!line.startsWith("\t")) {

      //push information if there's any
      if(curr_attr["name"] !== "") {
        out.push(curr_attr)
      }

      //Deep Copy init map
      for(i in init)
        curr_attr[i] = init[i]
      curr_attr["name"] = line.trim()
      return
    }

    //update listed attribute
    line = line.replaceAll("\t","")
    spl = line.split(":")
    spl[0] = spl[0].trim().toLowerCase()
    spl[1] = spl[1].trim()

    //change update procedure based on data type
    switch(typeof init[spl[0]]) {
      case "string":
        curr_attr[spl[0]] = spl[1]
        break

      case "number":
        if(spl[1] !== "all"){
          curr_attr[spl[0]] = parseInt(spl[1])
        }
        break

      case "boolean":
        curr_attr[spl[0]] = spl[1] === "True"
        break

      case "object":
        curr_attr[spl[0]] = spl[1].split(", ")
        break
    }
  })
  return out
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
