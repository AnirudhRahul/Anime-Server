const cheerio = require('cheerio');
const parser = require('../parser.js');

module.exports = function(body){
  json_list = []
  const $ = cheerio.load(body);
  $('tr a[title][class!=comments]').each(function (index, e) {
    if(this.attribs['href'].startsWith('/view/')){
      json_item={
            'torrent_name':this.attribs['title'],
      }
      json_list.push(json_item)
    }
  });

  ind = 0
  $('tr a[href^="magnet:?"]').each(function (index) {
      json_list[ind]['magnet_link'] = this.attribs['href']
      ind++
  });
  if(ind<json_list.length){
    return Error ('Not enough magnet links on page!')
  }

  ind = 0
  $('td[data-timestamp]').each(function (index) {
      json_list[ind]['time_uploaded'] = parseInt(this.attribs['data-timestamp'])
      ind++
  })
  if(ind<json_list.length){
    return Error ('Not enough timestamps on page!')
  }


  parser.add_episode_numbers(json_list)

  return json_list
}
