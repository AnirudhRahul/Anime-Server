const assert = require('assert');
const fs = require('fs');

module.exports.get_shows = function(path='./show_list.txt'){
  lines = fs.readFileSync(path, 'utf-8')
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

    out.push({
      'name':n,
      'subtitle_group':g,
      'query':q,
      'latest_only':latest_only,
      'tags':tags
    })

  })
  return out
}

function isNumeric(value) {
  return /^\d+$/.test(value)
}

module.exports.add_episode_numbers = function(input){
  assert(input.length>0)
  input.forEach(obj=>{
    assert('file_name' in obj)
  })
  //TODO get rid of episode numbers and start using episode names
  //useful for OVAs and movies
  if(input.length==1){
    input[0]['episode']=1
    return
  }

  words = []
  for(i=0;i<input.length;i++){
    modified = input[i]['file_name'].replace(/[^\w\s]/gi," ")
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

// function getImage(body, obj){
//   img_start = body.indexOf('https://i.')
//   min_index = -1
//   if(img_start!=-1){
//     endings = ['.png','.jpg','.webp','.jpeg']
//     s = endings.length;
//     for(i =0;i<s;i++)
//       endings.push(endings[i].toUpperCase())
//
//     min_ending = ''
//     endings.forEach(end=>{
//       res = body.indexOf(end,img_start)
//       if(min_index == -1)
//         [min_index,min_ending] = [res,end]
//       else if(res!=-1)
//         [min_index,min_ending] = [min(min_index,res),end]
//     })
//   }
//   if(min_index!=-1)
//     obj['thumbnail_link']=body.substring(img_start, min_index)+min_ending
// }
