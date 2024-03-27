import { readFileSync } from "node:fs";
import { WASI } from "node:wasi";
import path from "path";
import { RubyVM } from "@ruby/wasm-wasi";
import wasmFilePath from "../node_modules/@ruby/3.3-wasm-wasi/dist/ruby+stdlib.wasm";

const homePath = "/home/runruby";

export const initializeRuby = async (args = []) => {
  const wasmModule = await WebAssembly.compile(readFileSync(path.resolve(__dirname, wasmFilePath)));
  const wasi = new WASI({
    version: "preview1",
    preopens: {
      "/": `${homePath}`,
    },
    env: {
      BUNDLE_DEFAULT_INSTALL_USES_PATH: '/bundle'
    }
  });

  const ruby = new RubyVM();
  const imports = { wasi_snapshot_preview1: wasi.wasiImport };
  ruby.addToImports(imports);

  const instance = await WebAssembly.instantiate(wasmModule, imports);
  await ruby.setInstance(instance);

  wasi.initialize(instance);

  ruby.initialize(["ruby.wasm", "-e_=0", "-EUTF-8", '-I/gem_stubs', "-rdefault_stubs", ...args]);

  return ruby;
}
