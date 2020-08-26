const path = require('path')

module.exports.root_dir = function(env){
  folder_name = env=='production' ? 'prod-data':'dev-data'
  return path.join(__dirname,'..',folder_name)
}

module.exports.video_dir = function(env){
  return path.join(this.root_dir(env),'videos')
}

module.exports.database_dir = function(env){
  return path.join(this.root_dir(env),'database.txt')
}

module.exports.all = function(env){
  return {
    'root_dir': this.root_dir(env),
    'video_dir': this.video_dir(env),
    'database_dir': this.database_dir(env)
  }
}
