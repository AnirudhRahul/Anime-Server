const cheerio = require('cheerio');
const parser = require('../parser.js');

module.exports = function(body){
  json_list = []
  const $ = cheerio.load(body);
  $('tr a[title][class!=comments]').each(function (index, e) {
    if(this.attribs['href'].startsWith('/view/')){
      json_item={
            'torrent_name':this.attribs['title'],
            //assumes the torrent is only 1 file large
            'file_name':this.attribs['title'],
            'time_uploaded':0,
            // 'download_page':'https://nyaa.si' + this.attribs['href'],
            // 'ondisk':false,
      }
      json_list.push(json_item)
    }
  });

  ind = 0
  $('tr a[href^="magnet:?"]').each(function (index) {
      json_list[ind]['magnet_link'] = this.attribs['href']
      ind++
  });
  ind = 0
  $('td[data-timestamp]').each(function (index) {
      json_list[ind]['time_uploaded'] = parseInt(this.attribs['data-timestamp'])
      ind++
  })

  parser.add_episode_numbers(json_list)

  return json_list
}
