import typescript from "rollup-plugin-typescript"
import { uglify } from "rollup-plugin-uglify"
import commonjs from "rollup-plugin-commonjs"
import { version } from "./package.json"

export default {
  input: "./src/index.ts",

  external: ["react", "rxjs", "rxjs/operators"],
  output: [
    {
      file: `./dist/rrx-${version}.umd.js`,
      format: "umd",
      name: "rrx",
      globals: {
        react: "React",
        rxjs: "rxjs",
        "rxjs/operators": "rxjs.operators",
      },
    },
  ],

  plugins: [typescript(), commonjs({ extensions: [".js", ".ts"] }), uglify()],
}
