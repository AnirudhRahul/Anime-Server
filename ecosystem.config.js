module.exports = {
  apps : [{
    name: "anime-server-dev",
    script: "./app.js",
    watch: true,
    env: {
      NODE_ENV: "production",
    },
  }]
}
