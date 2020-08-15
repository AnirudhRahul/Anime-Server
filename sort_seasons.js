order = ['winter','spring','summer','fall']
//Idk how to sort in js dog

module.exports = function(a, b){
yearA = a.split('-')[1]
seasonA = a.split('-')[0]
indexA = order.indexOf(seasonA)

yearB = b.split('-')[1]
seasonB = b.split('-')[0]
indexB = order.indexOf(seasonB)

if(yearA!=yearB)
  return yearA.compareTo(yearB)
else{
  return indexA-indexB
}

}
