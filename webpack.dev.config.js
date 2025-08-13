// webpack.dev.config.js
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',               // ✅ make sure we build your app
  output: {
    publicPath: '/',                      // ✅ SPA paths resolve from root
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
      { test: /\.m?js$/, resolve: { fullySpecified: false } },
    ],
  },
  devServer: {
    host: '0.0.0.0',
    port: 8100,
    hot: true,
    allowedHosts: 'all',
    historyApiFallback: true,
    static: {
      directory: path.resolve(__dirname, 'public'),
      watch: true,
      serveIndex: false,
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'), // ✅ injects <script>
      inject: 'body',
    }),
    new webpack.ProvidePlugin({ process: 'process/browser' }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL || 'backup'),
      'process.env.PRE_LAUNCH': JSON.stringify(process.env.PRE_LAUNCH || 'hm'),
      'process.env.UNDER_CONSTRUCTION': JSON.stringify(process.env.UNDER_CONSTRUCTION || 'false'),
    }),
  ],
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  devtool: 'source-map',
};
