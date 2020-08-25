const path = require('path')

module.exports.root_dir = function(env, prefix=''){
  folder_name = env =='production'?'prod-data':'dev-data'
  return path.join(prefix,'..',folder_name)
}

module.exports.video_dir = function(env, prefix=''){
  return path.join(this.root_dir(env, prefix),'videos')
}

module.exports.database_dir = function(env, prefix=''){
  return path.join(this.root_dir(env, prefix),'database.txt')
}

module.exports.all = function(env, prefix=''){
  return {
    'root_dir': this.root_dir(env, prefix),
    'video_dir': this.video_dir(env, prefix),
    'database_dir': this.database_dir(env, prefix)
  }
}
