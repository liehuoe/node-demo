import * as path from 'path';
import webpack from 'webpack';
import * as ESLintPlugin from 'eslint-webpack-plugin';
import * as nodeExternals from 'webpack-node-externals';

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
  plugins: [new (ESLintPlugin as any)()],
  externals: [nodeExternals() as any]
} as webpack.Configuration;
