module.exports = {
  apps : [
  {
    name: "auto_torrent-prod",
    node_args: ["--expose-gc"],
    script: "./auto.js",
    env: {
      NODE_ENV: "production",
    },
  }
]
}
