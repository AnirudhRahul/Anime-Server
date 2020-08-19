module.exports = {
  apps : [
  {
    name: "app-dev",
    script: "./app.js",
    watch: true,
    env: {
      NODE_ENV: "development",
      DOWNLOAD_DIR: "/usr/local/lsws/Example/data/dev"
      PORT: 8001
    },
  },
  {
    name: "auto_torrent-dev",
    script: "./auto_torrent.js",
    env: {
      DOWNLOAD_DIR: "/usr/local/lsws/Example/data/dev"
    },
  }
]
}
