import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import OptimizeCSSPlugin from 'optimize-css-assets-webpack-plugin'
import safeParser from 'postcss-safe-parser'
import TerserPlugin from 'terser-webpack-plugin'
import * as wba from 'webpack-bundle-analyzer'

const { BundleAnalyzerPlugin } = wba

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
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].hash.[contenthash].css',
      chunkFilename: 'static/css/[id].hash.[contenthash].css'
    })
  ]
}

if (process.env.npm_config_report) {
  config.plugins.push(new BundleAnalyzerPlugin())
}

export default config
