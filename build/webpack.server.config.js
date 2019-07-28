const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const baseConfig = require('./webpack.base.config.js')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = merge(baseConfig, {
  entry: './src/entry-server.js',
  target: 'node',
  devtool: 'source-map',
  output: {
    libraryTarget: 'commonjs2'
  },
  externals: nodeExternals({
    whitelist: /\.css$/
  }),
  plugins: [
    new VueSSRServerPlugin(),
    new CopyPlugin([{ from: 'public', to: '.' }])
  ],
  module: {
    rules: [{
      test: /\.css$/,
      use: 'null-loader'
    }, {
      test: /\.scss$/,
      use: 'null-loader'
    }]
  }
})
