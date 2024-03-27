import { nodeResolve } from "@rollup/plugin-node-resolve";
import executable from "rollup-plugin-executable";
import terser from "@rollup/plugin-terser";
import url from "@rollup/plugin-url";

export default [
  {
    input: {
      ruby: `src/ruby.js`,
      bundle: `src/bundler.js`
    },
    output: {
      dir: "dist",
      format: "cjs",
      entryFileNames: "[name]"
    },
    makeAbsoluteExternalsRelative: true,
    external: ["node:fs", "node:wasi", "node:buffer"],
    plugins: [
      nodeResolve({ extensions: [".js", ".wasm"] }),
      url({ include: ["**/*.wasm"] }),
      terser(),
      executable()
    ]
  }
];
