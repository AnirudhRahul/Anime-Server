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
  entry => typeof entry.episode == "number",
  entry => {
    entry.episode = 'Episode '+entry.episode
    return entry
  },
  database_dir
)
