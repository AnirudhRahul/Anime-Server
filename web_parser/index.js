const episode_parser = require('./episode_parser.js');
exports.nyaa_si = require("./nyaa_si.js");
exports.parseBody = function(body, to_JSON, database_dir, show){
    return new Promise(function(resolve, reject) {
      let resp_json = to_JSON(body)
      episode_parser.add_episode_numbers(resp_json, show)
      resp_json = resp_json.filter(item => 'episode' in item)

      if(show.download_latest!=0 && resp_json.length>1){
        //1 day in seconds
        const max_diff = 1*60*60
        const latest_json = []
        let index = 0
        for(let weeks = 0; weeks<show.download_latest && index<resp_json.length; weeks++){
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

      const db_json = require('../database.js').readSync(database_dir)
      const missing_episodes = new Set()
      for(let j = 0; j < resp_json.length; j++){
          let found = false
          if(show.name in db_json)
            for(let i = 0; i < db_json[show.name].length; i++)
              if(resp_json[j].episode === db_json[show.name][i].episode && 'time_downloaded' in db_json[show.name][i]){
                  found = true
                  break
              }
          if(!found)
            missing_episodes.add(resp_json[j].episode)
      }

      const toDownload = []
      for(item of resp_json){
        if(missing_episodes.has(item.episode)){
          toDownload.push(item)
          missing_episodes.delete(item.episode)
        }
      }
      for(item of toDownload)
        item['show_name'] = show.name

      resolve(toDownload)
    });

}
