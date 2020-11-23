module.exports = {
  apps : [
  {
    name: "auto_torrent-prod",
    "max_memory_restart" : "1000M",
    node_args: ["--inspect"],
    script: "./auto.js",
    env: {
      NODE_ENV: "production",
    },
  }
]
}
