const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const { WebpackDeduplicationPlugin } = require('webpack-deduplication-plugin');


module.exports = {
    // entry: {
    //   frontend: './frontend/src/index.tsx',
    // },
    // output: {
    //   path: path.resolve('./frontend/static/frontend/'),
    //   filename: '[name]-[hash].js',
    //   publicPath: 'static/frontend/',
    // },
    mode: "production",
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
        PRODUCTION: JSON.stringify(true),
        'process.env': {
            'NODE_ENV': JSON.stringify('production')
        }
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.env.BASE_URL': JSON.stringify(process.env.BASE_URL || 'backup'),
        'process.env.PRE_LAUNCH': JSON.stringify(process.env.PRE_LAUNCH || 'hm'),
        'process.env.UNDER_CONSTRUCTION': JSON.stringify(process.env.UNDER_CONSTRUCTION || 'false'),
      }),
      new WebpackDeduplicationPlugin({}),
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      // fallback: {
      //   process: require.resolve('process/browser'),
      // }
    },
    optimization: {
      minimize: true,
      minimizer:[
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info'], // Delete console statements
            },
          },
        })
      ]
    },
  };