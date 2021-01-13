const cheerio = require('cheerio');

module.exports = function(body){
  const $ = cheerio.load(body);
  const title = $('h3[class=panel-title]').first().text().trim()
  const magnet_link = $('a[class=card-footer-item]').first().attr('href')
  const time_uploaded = parseInt($('div[data-timestamp]').first().attr('data-timestamp'))

  const required_keys = ['torrent_name', 'magnet_link', 'time_uploaded']

  return [{
    torrent_name: title,
    magnet_link: magnet_link,
    time_uploaded: time_uploaded
  }]
}
