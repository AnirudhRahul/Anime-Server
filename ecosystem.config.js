module.exports = {
  apps : [
  {
    name: "auto_torrent-prod",
    "max_memory_restart" : "500M",
    script: "./torrent/auto_torrent.js",
    env: {
      NODE_ENV: "production",
    },
  }
]
}
