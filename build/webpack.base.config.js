const path = require('path')
const utils = require('./utils')
const merge = require('webpack-merge')
const prodConfig = require('./webpack.prod.config.js')

const VueLoaderPlugin = require('vue-loader/lib/plugin')
const SizePlugin = require('size-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { GenerateSW } = require('workbox-webpack-plugin')

function resolve(dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = merge(prodConfig, {
  mode: 'production',
  context: path.resolve(__dirname, '../'),
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/'
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.json'],
    alias: {
      '@': resolve('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: [
          'vue-loader',
          {
            loader: 'html-minifier-loader',
            options: {
              keepClosingSlash: true,
              html5: true,
              caseSensitive: true,
              collapseWhitespace: false
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [
          process.env.NODE_ENV === 'development' ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src')]
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      }
    ]
  },
  node: {
    // prevent webpack from injecting useless setImmediate polyfill because Vue
    // source contains it (although only uses it if it's native).
    setImmediate: false,
    // prevent webpack from injecting mocks to Node native modules
    // that does not make sense for the client
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  },
  plugins: [
    new VueLoaderPlugin(),
    new SizePlugin(),
    new GenerateSW({
      runtimeCaching: [{
        urlPattern: /cover/,
        handler: 'CacheFirst'
      }]
    })
  ]
})
