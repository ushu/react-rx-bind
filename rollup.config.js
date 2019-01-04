import { uglify } from "rollup-plugin-uglify"
import commonjs from "rollup-plugin-commonjs"
import { version } from "./package.json"

export default {
  input: "./lib/index.js",

  external: ["react", "rxjs", "rxjs/operators"],
  output: [
    {
      file: `./dist/react-rx-bind-${version}.umd.js`,
      format: "umd",
      name: "RxBind",
      globals: {
        react: "React",
        rxjs: "rxjs",
        "rxjs/operators": "rxjs.operators",
      },
    },
  ],

  plugins: [commonjs({ extensions: [".js", ".ts"] }), uglify()],
}
