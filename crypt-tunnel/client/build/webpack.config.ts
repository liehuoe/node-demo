import * as path from "path";
import webpack from "webpack";
import * as npmPackage from "../package.json";
import * as ESLintPlugin from "eslint-webpack-plugin";
const ESLintWebpackPlugin =
  ESLintPlugin as unknown as typeof ESLintPlugin.default;
import * as nodeExternals from "webpack-node-externals";

const rootDir = path.resolve(__dirname, "../");

// alias
const alias: { [tag: string]: string } = {};
for (const item of Object.entries(npmPackage._moduleAliases)) {
  alias[item[0]] = path.join(rootDir, item[1]);
}

export default {
  mode: "production",
  entry: path.join(rootDir, "src/app.ts"),
  target: "node",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias,
  },
  output: {
    filename: "app.js",
    path: path.join(rootDir, "dist"),
  },
  plugins: [
    new ESLintWebpackPlugin({
      extensions: ["js", "ts"],
    }),
  ],
  externals: [nodeExternals()],
} as webpack.Configuration;
