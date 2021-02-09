const path = require("path");
const {argv} = require('yargs')
const glob = require('glob')
const fs = require('fs')

env = process.env.NODE_ENV || 'development';
if(argv.prod)
  env = 'production'

const {root_dir, video_dir, database_dir} = require('../dirs.js').all(env)

const database = require('../database.js')


database.select_and_replace(
  entry => typeof entry.metadata.subtitle_path == "string",
  entry => {
    if(!entry.metadata.subtitle_path|| entry.metadata.subtitle_path.length==0){
      return []
    }
    entry.metadata.subtitle_path = {
      name: 'Default',
      language: 'eng',
      is_default: true,
      path: entry.metadata.subtitle_path
    }
    return entry
  },
  database_dir
)

console.log("Successfully updated", database_dir)
