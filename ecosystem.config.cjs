module.exports = {
  apps: [{
    name: 'api.musedash.moe',
    script: 'api/index.js',
    instances: 1,
    autorestart: true,
    node_args: '--max-old-space-size=8192',
    watch: false
  }, {
    name: 'musedash.moe',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false
  }]
}
