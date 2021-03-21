assert = require('assert');
fs = require('fs');
path = require('path');
YAML = require('js-yaml');

module.exports.get_shows = function(){
  const file = fs.readFileSync(path.join(__dirname,'show_list.yaml'), 'utf8')
  const res = YAML.load(file)
  const output_list = []
  const ongoing_defaults = {
    'Series': true,
    'Batch': false
  }
  for(const show of Object.keys(res)){
    const item = res[show]
    // console.log(item)
    if(item.Type){
      if(!(item.Type in ongoing_defaults)){
        throw item.Type + "is an invalid type must be either Series or Batch"
      }
    }
    output_list.push({
      name: show,
      official_name: item.Official_Name || '',
      query: item.Query || '',
      link: item.Link || '',
      type: item.Type || 'Series',
      ongoing: item.Ongoing || (item.Type ? ongoing_defaults[item.Type]:true),
      tags: item.Tags || [],
      download_latest: item.Download_Latest || 0,
      offset: item.Offset || 0,
      format: item.Format || []
    })
  }

  for(const show of output_list){
    for(const item of show.format){
      assert(item.Folder && (item.Episode || item.Episode_names))
    }
  }

  return output_list
}

if (require.main === module) {
    console.log(this.get_shows());
}
