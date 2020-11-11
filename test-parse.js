const fs = require('fs');
const path = require('path');
const YAML = require('js-yaml');

module.exports.get_shows = function(){
  const show_list = fs.readFileSync(path.join(__dirname,'show_list.txt'), 'utf-8')
  const doc = YAML.safeLoad(show_list);

  //initial values of attributes
  init = {
    "name":"",
    "official_name":"",
    "query":"",
    "ongoing":false,
    "tags":[],
    "download-latest":0,
    "stream-latest":0,
    "offset":0
  }

  curr_attr = {}
  //Deep copy init map
  for(i in init)
    curr_attr[i] = init[i]

  out = []
  lines.forEach(line => {

    //Don't parse comments or empty lines
    if(line.startsWith("#") || line.trim().length === 0){
      return
    }

    //new show name
    if(!line.startsWith("\t") && !line.startsWith(" ")) {

      //push information if there's any
      if(curr_attr["name"] !== "") {
        copy = {}
        //Deep copy curr_attr map
        for(i in init)
          copy[i] = curr_attr[i]
        out.push(copy)
      }

      //Deep Copy init map
      for(i in init)
        curr_attr[i] = init[i]
      curr_attr["name"] = line.trim()
      return
    }

    //update listed attribute
    line = line.trim()
    spl = line.indexOf(":")

    attr = line.substring(0,spl).trim().toLowerCase()
    value = line.substring(spl+1).trim()
    //change update procedure based on data type
    switch(typeof init[attr]) {
      case "string":
        curr_attr[attr] = value
        break

      case "number":
        if(value !== "all"){
          curr_attr[attr] = parseInt(value)
        }
        break

      case "boolean":
        curr_attr[attr] = value.toLowerCase() === "true"
        break

      case "object":
        curr_attr[attr] = value.split(", ")
        break
    }
  })

  //add the last entry that wasn't previously added
  out.push(curr_attr)

  return out
}

if (require.main === module) {
    console.log(this.get_shows());
}
