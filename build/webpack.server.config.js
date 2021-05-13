import merge from 'webpack-merge'
import nodeExternals from 'webpack-node-externals'
import baseConfig from './webpack.base.config.js'
import VueSSRServerPlugin from 'vue-server-renderer/server-plugin.js'
import CopyPlugin from 'copy-webpack-plugin'

export default merge(baseConfig, {
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
