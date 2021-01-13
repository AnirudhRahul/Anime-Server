function isNumeric(str) {
  return /^\d+$/.test(str) || /^\d+\.\d+$/.test(str)
}

function format(name){
  // Remove special characters
  name = name.replace(/[^a-zA-Z0-9.{}#]/g,' ')
  // Remove version tags
  name = name.replace(/v[0-9]/gi,'')
  // Remove periods but not decimal points
  name = name.replace(/(?<!\d)\.(?!\d)/g,' ')
  // Remove any hex tags in the string
  name = name.replace(/\b[a-f0-9]{6,}\b/gi, '')
  // Remove duplicate spaces
  name = name.replace(/  +/g, ' ');
  // Trim to remove trailing/leading spaces
  return name.trim()
}

function removeLeadZeros(str){
  return str.trim().replace(/^0+/g,'')
}

function matchStr(strA, strB){
  if(isNumeric(strA) && isNumeric(strB)){
    return parseFloat(strA, 10) == parseFloat(strB, 10)
  }
  if(Math.abs(strA.length-strB.length) == 1){
    let short = strA.length<strB.length ? strA : strB
    let long =  strA.length<strB.length ? strB : strA
    short = short.toLowerCase()
    long = long.toLowerCase()
    return long.endsWith('p') && long.startsWith(short)
  }
  return strA==strB
}

function isHexTag(word){
  return /[a-f0-9]{6,}/gi.test(word)
}

function include_index(list, str){
  for(let i=0; i<list.length; i++){
    if(list[i].includes(str))
      return i
  }
  return -1
}

module.exports.parse = function(title, show){
  if(show.type=='Movie')
    return show.name
  const query_words = format(show.query).split(" ")
  let episode_index = include_index(query_words, "{E#}")
  if(episode_index==-1){
    console.error("Query formatted incorrectly!!!")
    console.error(show.query)
    console.error("^This should have an {E#} to indicate the position of the episode number")
    throw 'ShowInputError: Query format errory must include {E#}';
  }
  const episode_prefix = query_words[episode_index].split("{E#}")[0]
  const episode_suffix = query_words[episode_index].split("{E#}")[1]
  //TODO: Should probably not ignore the prefix and suffix of {E#}
  query_words[episode_index] = "{E#}"
  const before_episode = query_words.slice(0, episode_index)
  const after_episode = query_words.slice(episode_index+1)

  const word_list = format(title).split(" ")

  // 2 pointer algorithm to find the position of the episode number
  let start_index = 0
  let last_start_match = start_index
  let before_index = 0
  while(before_index<before_episode.length && start_index<word_list.length){
    if(matchStr(word_list[start_index], before_episode[before_index])){
      start_index+=1
      before_index+=1
      last_start_match = start_index
    }
    else{
      start_index+=1
    }
  }

  let end_index = word_list.length-1
  let last_end_match = end_index
  let after_index = after_episode.length-1
  while(after_index>=0 && end_index>=0){
    if(matchStr(word_list[end_index], after_episode[after_index])){
      end_index-=1
      after_index-=1
      last_end_match = end_index
      // console.log(word_list[end_index], after_episode[after_index], 'match')
    }
    else{
      // console.log(word_list[end_index], after_episode[after_index], 'no match')
      end_index-=1
    }
  }

  if(last_start_match>last_end_match){
    console.error('Unexpected episode parsing error')
    return
  }

  let result = word_list.slice(last_start_match, last_end_match+1).join(" ").trim()

  if(result.startsWith(episode_prefix)){
    result = result.slice(episode_prefix.length)
  }

  if(result.endsWith(episode_suffix)){
    result = result.slice(-episode_suffix.length)
  }

  // Append episode if result is a single word or if the result starts with a number
  if(last_start_match==last_end_match || isNumeric(word_list[last_start_match])){
    result = 'Episode ' + removeLeadZeros(result)
  }

  return result
}

// Mutates elements of input and adds episode number deduced from torrent name
// module.exports.add_episode_numbers = function(input, show){
//   assert(input.length>0)
//   input.forEach(obj=>{
//     assert('torrent_name' in obj)
//   })
//
//   if(show.type=='Movie' && input.length==1){
//     input[0]['episode'] = show.name
//     return
//   }
//
//
//   const query_words = format(show.query).split(" ")
//   let episode_index = include_index(query_words, "{E#}")
//   if(episode_index==-1){
//     console.error("Query formatted incorrectly!!!")
//     console.error(show.query)
//     console.error("^This should have an {E#} to indicate the position of the episode number")
//     throw 'Query format errory must include {E#}';
//   }
//
//   const episode_prefix = query_words[episode_index].split("{E#}")[0]
//   const episode_suffix = query_words[episode_index].split("{E#}")[1]
//
//   //TODO: Should probably not ignore the prefix and suffix of {E#}
//   query_words[episode_index] = "{E#}"
//
//   console.log(query_words)
//
//   const before_episode = query_words.slice(0, episode_index)
//   const after_episode = query_words.slice(episode_index+1)
//
//   for(let i=0;i<input.length;i++){
//     const word_list = format(input[i]['torrent_name']).split(" ")
//
//     // 2 pointer algorithm to find the position of the episode number
//     let start_index = 0
//     let last_start_match = start_index
//     let before_index = 0
//     while(before_index<before_episode.length && start_index<word_list.length){
//       if(matchStr(word_list[start_index], before_episode[before_index])){
//         start_index+=1
//         before_index+=1
//         last_start_match = start_index
//       }
//       else{
//         start_index+=1
//       }
//     }
//
//     let end_index = word_list.length-1
//     let last_end_match = end_index
//     let after_index = after_episode.length-1
//     while(after_index>=0 && end_index>=0){
//       if(matchStr(word_list[end_index], after_episode[after_index])){
//         end_index-=1
//         after_index-=1
//         last_end_match = end_index
//         // console.log(word_list[end_index], after_episode[after_index], 'match')
//       }
//       else{
//         // console.log(word_list[end_index], after_episode[after_index], 'no match')
//         end_index-=1
//       }
//     }
//
//     if(last_start_match>last_end_match){
//       console.error('Unexpected episode parsing error')
//       return
//     }
//
//     let result = word_list.slice(last_start_match, last_end_match+1).join(" ").trim()
//
//     if(result.startsWith(episode_prefix)){
//       result = result.slice(episode_prefix.length)
//     }
//
//     if(result.endsWith(episode_suffix)){
//       result = result.slice(-episode_suffix.length)
//     }
//
//     // Append episode if result is a single word or if the result starts with a number
//     if(last_start_match==last_end_match || isNumeric(word_list[last_start_match])){
//       result = 'Episode ' + removeLeadZeros(result)
//     }
//
//     input[i]['episode'] = result
//   }
//
// }
