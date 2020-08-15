module.exports = function(list){
  name = []
  sub_group = []
  list.forEach(q => {
    g = q.split('[').pop().split(']')[0];
    rest = q.substring(q.indexOf(']')+1)
    n = rest
    //Extract the english name if its in parenthesis
    if(rest.includes('(') && rest.includes(')')){
      p = rest.split('(').pop().split(')')[0];
      if (p.length / rest.length > 0.2)
        n=p
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
    sub_group.push(g)
    n = n.trim()
    name.push(n)
  })
  return [sub_group, name]
}
