import path from 'path'
import utils from './utils.js'
import { merge } from 'webpack-merge'
import prodConfig from './webpack.prod.config.js'
import devConfig from './webpack.dev.config.js'

import VueLoaderPlugin from '@vue/vue-loader-v15/lib/plugin.js'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolve(dir) {
  return path.join(__dirname, '..', dir)
}

if (process.env.development) {
  console.log('Build for Development')
}

export default merge(process.env.development ? devConfig : prodConfig, {
  context: path.resolve(__dirname, '../'),
  output: {
    filename: '[name].hash.[contenthash].js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: [
          '@vue/vue-loader-v15'
        ]
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      },
      {
        test: /\.sass$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader'
          }
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
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].hash.[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].hash.[hash:7].[ext]')
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/,
        oneOf: [
          {
            test: /covers\/.*_cover\.webp$/,
            use: [
              {
                loader: 'file-loader',
                options: {
                  esModule: false,
                  name: 'covers/[name].hash.[hash:9].[ext]'
                }
              }
            ]
          },
          {
            use: [
              {
                loader: 'url-loader',
                options: {
                  limit: 10000,
                  name: utils.assetsPath('img/[name].hash.[hash:7].[ext]')
                }
              }
            ]
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.json'],
    alias: {
      '@': resolve('src')
    },
    byDependency: {
      esm: {
        fullySpecified: false
      }
    },
    fallback: {
      dgram: false,
      fs: false,
      net: false,
      tls: false,
      child_process: false
    }
  },
  plugins: [
    new VueLoaderPlugin()
  ]
})
