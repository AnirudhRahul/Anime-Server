module.exports = {
  apps : [{
    name: "anime-server-dev",
    script: "./app.js",
    watch: true,
    env: {
      NODE_ENV: "development",
      PORT: 8000
    },
  },
  {
    name: "cron-torrenter-dev",
    script: "./auto_torrent.js",
    watch: true,
    env: {
      DOWNLOAD_DIR: "/usr/local/lsws/Example/data/dev"
    },
  }
]
}
