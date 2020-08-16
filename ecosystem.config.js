module.exports = {
  apps : [{
<<<<<<< HEAD
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
=======
    name: "app-dev",
    script: "./app.js",
    watch: true,
    env: {
      NODE_ENV: "development",
      PORT: 8001
    },
  },
  {
    name: "auto_torrent-dev",
    script: "./auto_torrent.js",
    env: {
      DOWNLOAD_DIR: "/usr/local/lsws/Example/data/dev"
>>>>>>> dev
    },
  }
]
}
