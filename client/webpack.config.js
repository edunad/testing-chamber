
const webpack = require('webpack');
const helpers = require('./helpers');
const path = require('path');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  mode: 'development',

  devtool: 'eval', // source-map
  cache: false,

  entry: {
	  'polyfills': './polyfills.ts',
    'app': './main',
    'styles': './css/css.js'
  },

  // Config for our build files
  output: {
    path: helpers.root('../server/static'),
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].js'
  },

  resolve: {
    extensions: ['.ts', '.js', '.css', '.html', '.json'],

    modules: [
      helpers.root('src'),
      'node_modules'
    ]
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader"
        ]
      },

      {
        test: /\.ts$/,
        loaders: ['awesome-typescript-loader', 'angular2-template-loader?keepUrl=true'],
        exclude: [/\.(spec|e2e)\.ts$/]
      },

      {
        test: /\.html$/,
        use: [
          {
            loader: 'file-loader',
            options: {
            	name: '[path][name].[ext]',
            	publicPath:'/'
            },
          }
        ],
        include: __dirname,
        exclude: [
          path.join(__dirname, 'index.html')
        ],
      },

      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader: 'file-loader?name=/fonts/[name]-[hash].[ext]'
      },

      {
        test: /\.svg/,
        loader: 'svg-url-loader'
      }
    ]
  },
  optimization: {
    splitChunks: {
     cacheGroups: {
      vendor: {
       test: /node_modules/,
       chunks: 'initial',
       name: 'vendor',
       enforce: true
      },
     }
    }
  },
  node: {
    console: false,
    global: true,
    process: true,
    Buffer: false,
    setImmediate: false
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "/css/[name].css",
      chunkFilename: "/css/[id].css"
    }),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorOptions: { discardComments: { removeAll: true } },
      canPrint: true
    }),
  	new CopyWebpackPlugin([
      {
        from: './index.html'
      },
      {
        from: './client_config.json'
      },
      {
        from: './animations',
        to: './animations'
      },
      {
        from: './img',
        to: './img'
      }
    ]),
    //new BundleAnalyzerPlugin()
  ]
};
