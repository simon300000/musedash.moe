const merge = require('webpack-merge')
const baseConfig = require('./webpack.base.config.js')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')

module.exports = merge(baseConfig, {
  entry: './src/entry-client.js',
  plugins: [
    new VueSSRClientPlugin()
  ]
})
