module.exports = {
  apps : [
  {
    name: "auto_torrent-prod",
    "max_memory_restart" : "1000M",
    script: "./auto.js",
    env: {
      NODE_ENV: "production",
    },
  }
]
}
