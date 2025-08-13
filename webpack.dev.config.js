const path = require('path');
const webpack = require('webpack');

module.exports = {
    // entry: {
    //   frontend: './frontend/src/index.tsx',
    // },
    // output: {
    //   path: path.resolve('./frontend/static/frontend/'),
    //   filename: '[name]-[hash].js',
    //   publicPath: 'static/frontend/',
    // },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    },
    plugins: [
      new webpack.ProvidePlugin({
          process: "process/browser"

      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL || 'backup'),
        'process.env.PRE_LAUNCH': JSON.stringify(process.env.PRE_LAUNCH || 'hm'),
        'process.env.UNDER_CONSTRUCTION': JSON.stringify(process.env.UNDER_CONSTRUCTION || 'false'),
      }),
      
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      // fallback: {
      //   process: require.resolve('process/browser'),
      // }
    }
  };