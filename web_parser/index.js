const database = require('../database.js')

const nyaa_search = require("./nyaa_search.js");
const nyaa_view = require("./nyaa_view.js");

exports.parseBody = function(body, url, database_dir, show){
    return new Promise(function(resolve, reject) {
      // Query case
      if(url.includes('nyaa.si/?') && url.includes('q=')){
        return resolve(nyaa_search(body))
      }
      else if(url.includes('nyaa.si/view')){
        console.log("BATCH JSON")
        return resolve(nyaa_view(body))
      }
      else{
        console.log("No valid body parser found for", url)
        return reject()
      }
    });

}
