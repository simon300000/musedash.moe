const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const safeParser = require('postcss-safe-parser')
const TerserPlugin = require('terser-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const utils = require('./utils')

const config = {
  mode: 'production',
  performance: {
    hints: false
  },
  optimization: {
    splitChunks: {
      name: true,
      chunks: 'all',
      cacheGroups: {
        vue: {
          test: /[\\/]node_modules[\\/]_?(vue|vuex|vue-router)@.*/,
          name: 'vue',
          chunks: 'all'
        }
      }
    },
    minimizer: [
      new TerserPlugin({ parallel: true }),
      new OptimizeCSSPlugin({ cssProcessorOptions: { parser: safeParser, map: { inline: false } } })
    ]
  },
  module: {
    rules: [{
      test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: utils.assetsPath('img/[name].[hash:7].[ext]')
          }
        }
      ]
    }]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash].css',
      chunkFilename: 'static/css/[id].[contenthash].css'
    })
  ]
}

if (process.env.npm_config_report) {
  config.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = config
