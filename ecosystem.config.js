module.exports = {
  apps : [{
    name: "anime-server-dev",
    script: "./app.js",
    watch: "../",
    env: {
      NODE_ENV: "development",
      PORT: 3001
    },
  }]
}
