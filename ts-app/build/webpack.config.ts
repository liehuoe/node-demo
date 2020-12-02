import webpack from 'webpack';
import * as nodeExternals from 'webpack-node-externals';
import * as path from 'path';

const rootDir = path.resolve(__dirname, '../');

export default {
  mode: 'production',
  entry: path.join(rootDir, 'src/app.ts'),
  target: 'node',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader'
      },
      {
        test: /\.(js|tsx?)$/,
        loader: 'eslint-loader',
        enforce: "pre",
        include: [path.join(rootDir, 'src')]
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
    alias: {
      '@': path.join(rootDir, 'src')
    }
  },
  output: {
    filename: 'app.js',
    path: path.join(rootDir, 'dist')
  },
  externals: [nodeExternals()]
} as webpack.Configuration;
