import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const config = {
  mode: 'development',
  performance: {
    hints: false
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].hash.[contenthash].css',
      chunkFilename: 'static/css/[id].hash.[contenthash].css'
    })
  ]
}

export default config
