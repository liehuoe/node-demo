import path from "path";
import { Configuration } from "webpack";
import ESLintPlugin from "eslint-webpack-plugin";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";

const rootDir = path.resolve(__dirname, "../");

export default {
  mode: "production",
  entry: path.join(rootDir, "src/app.ts"),
  target: "node",

  module: {
    rules: [{ test: /\.tsx?$/, use: "ts-loader" }],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    plugins: [new TsconfigPathsPlugin()],
  },
  output: {
    filename: "app.js",
    path: path.join(rootDir, "dist"),
  },
  plugins: [new ESLintPlugin({ extensions: [".ts", ".js"] })],
} as Configuration;
