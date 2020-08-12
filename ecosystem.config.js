module.exports = {
  apps : [{
    name: "anime-server-dev",
    script: "./app.js",
    watch: false,
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
  }]
}
