module.exports = {
  apps : [
  {
    name: "auto_torrent-prod",
    "max_memory_restart" : "750M",
    script: "./torrent/auto_torrent.js",
    env: {
      NODE_ENV: "production",
    },
  }
]
}
