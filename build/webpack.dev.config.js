import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import utils from './utils.js'

const config = {
  mode: 'development',
  performance: {
    hints: false
  },
  module: {
    rules: [{
      test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: utils.assetsPath('img/[name].hash.[hash:7].[ext]')
          }
        }
      ]
    }]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].hash.[contenthash].css',
      chunkFilename: 'static/css/[id].hash.[contenthash].css'
    })
  ]
}

export default config
