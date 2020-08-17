const assert = require('assert');

module.exports.parse_markup = function(input){
  out = []
  tags = []
  input.forEach(line => {
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
    latest_only = line.startsWith("~")
    if(latest_only)
      line = line.substring(1)
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

  if(input.length==1)
    input[0]['episode']=1

  words = []
  for(i=0;i<input.length;i++){
    modified = input[i]['file_name'].replace(/[^\w\s]/gi," ")
    words.push(modified.split(" "))
  }

  common_words = new Set(words[0].filter(val => words[1].includes(val)))
  for(i=0;i<input.length;i++)
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
  input.forEach(obj=>{
    assert('episode' in obj)
  })

}
