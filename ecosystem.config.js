module.exports = {
  apps : [
  {
    name: "auto_torrent-prod",
    script: "./torrent/auto_torrent.js",
    env: {
      NODE_ENV: "production",
    },
  }
]
}
