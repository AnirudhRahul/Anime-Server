module.exports = {
  apps : [
  {
    name: "app-prod",
    script: "./app.js",
    watch: false,
    env: {
      NODE_ENV: "production",
      PORT: 8000
    },
  },
  {
    name: "auto_torrent-prod",
    script: "./auto_torrent.js",
    env: {
      DOWNLOAD_DIR: "/usr/local/lsws/Example/data/prod"
    },
  }
]
}
