module.exports = function(input){

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
