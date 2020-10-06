exports.nyaa_si = require("./nyaa_si.js");
exports.parseBody = function(body, to_JSON, database_dir, show){
    return new Promise(function(resolve, reject) {
      let resp_json = to_JSON(body)

      if(show['download-latest']!=0 && resp_json.length>1){
        //1 day in seconds
        max_diff = 1*60*60
        latest_json = []
        index = 0
        for(let weeks = 0; weeks<show['download-latest'] && index<resp_json.length; weeks++){
          latest_json.push(resp_json[index])
          last = resp_json[index]
          index++
          while(index < resp_json.length)
            if(last['time_uploaded']-resp_json[index]['time_uploaded']<max_diff){
              latest_json.push(resp_json[index])
              index++
            }
            else{
              break
            }
        }
        //Overwrites resp json since we are only want the latest values
        resp_json = latest_json
      }

      const cur_json = require('../database.js').readSync(database_dir)
      const toDownload = []
      const show_name = show['name']
      for(let j = 0; j < resp_json.length; j++){
          let found = false
          if(show_name in cur_json)
            for(let i = 0; i < cur_json[show_name].length; i++)
              if(resp_json[j]['torrent_name'] === cur_json[show_name][i]['torrent_name'] && 'time_downloaded' in cur_json[show_name][i]){
                  found = true
                  break
              }
          if(!found)
            toDownload.push(resp_json[j])
      }
      for(item of toDownload)
        item['show_name'] = show_name
      resolve(toDownload)
    });

}
