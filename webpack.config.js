const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const isProduction = process.env.NODE_ENV === 'production';

module.exports = [
  create('./src/popup.tsx'),
  create('./src/options.tsx'),
  create('./src/background.ts'),
];

function create(file) {
  const parsed = path.parse(file);
  const name = parsed.name;
  const ext = parsed.ext;
  const plugins = [
    new LodashModuleReplacementPlugin(),
    // new BundleAnalyzerPlugin(),
  ];
  if (ext === '.tsx') {
    plugins.push(new HtmlWebpackPlugin({
      filename: `${name}.html`,
      inject: false,
      template: require('html-webpack-template'),
      appMountId: 'root',
      title: 'SyncMyCookie'
    }));
  }
  if (isProduction) {
    plugins.push(new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].chunk.css',
    }));
  }
  const alias = {
    '@ant-design/icons/lib/dist$': path.resolve(__dirname, './src/icons.ts'),
  };
  // Service worker doesn't support XMLHttpRequest, use fetch adapter instead
  if (name === 'background') {
    alias['./adapters/xhr'] = path.resolve(__dirname, './src/adapters/fetch-adapter.js');
  }
  return {
    mode: isProduction ? 'production' : 'development',
    entry: file,
    output: {
      filename: `${name}.js`,
      path: path.resolve(__dirname, './build'),
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            { loader: 'babel-loader' },
            { loader: 'awesome-typescript-loader' },
          ]
        },
        {
          test: /\.(scss|sass)$/,
          exclude: /\.module\.(scss|sass)$/,
          use: getStyleLoaders(
            {
              importLoaders: 2,
            },
            'sass-loader',
            {
              implementation: require('sass'),
            }
          ),
        },
        {
          test: /\.module\.(scss|sass)$/,
          use: getStyleLoaders(
            {
              importLoaders: 2,
              modules: true,
              localIdentName: '[name]__[local]__[hash:base64:5]'
            },
            'sass-loader',
            {
              implementation: require('sass'),
            }
          ),
        },
        {
          test: /.less$/,
          use: getStyleLoaders(
            {
              importLoaders: 2,
            },
            'less-loader',
            { javascriptEnabled: true },
          ),
        },
      ],
    },
    plugins,
  };
};

function getStyleLoaders(cssOptions, preProcessor, preProcessorOptions) {
  const loaders = [
    isProduction ? { loader: MiniCssExtractPlugin.loader } : 'style-loader',
    {
      loader: 'css-loader',
      options: cssOptions,
    },
    {
      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
      loader: 'postcss-loader',
      options: {
        // Necessary for external CSS imports to work
        // https://github.com/facebook/create-react-app/issues/2677
        ident: 'postcss',
        plugins: () => [
          require('postcss-flexbugs-fixes'),
          require('postcss-preset-env')({
            autoprefixer: {
              flexbox: 'no-2009',
            },
            stage: 3,
          }),
        ],
      },
    },
  ];
  if (preProcessor) {
    loaders.push({
      loader: preProcessor,
      options: preProcessorOptions,
    });
  }
  return loaders;
};
