import { readFileSync } from "node:fs";
import path from "path";
import { WASI } from "node:wasi";
import { consolePrinter, RubyVM } from "@ruby/wasm-wasi";
import wasmFilePath from "../node_modules/@ruby/3.3-wasm-wasi/dist/ruby.debug+stdlib.wasm";

const rubyStubsPath = "/gem_stubs";
const defaultStubsPath = `${rubyStubsPath}/default_stubs.rb`;
const rootFolder = "/home/runruby";

export const initializeRuby = async (args = []) => {
  const wasmModule = await WebAssembly.compile(
    // eslint-disable-next-line no-undef
    readFileSync(path.resolve(__dirname, wasmFilePath)),
  );

  const wasi = new WASI({
    version: "preview1",
    preopens: {
      "/": rootFolder,
    },
    env: {
      BUNDLE_DEFAULT_INSTALL_USES_PATH: "/bundle",
    },
  });

  const rubyVM = new RubyVM();
  const imports = {
    wasi_snapshot_preview1: wasi.wasiImport,
  };

  rubyVM.addToImports(imports);

  const printer = consolePrinter();
  printer.addToImports(imports);

  const instance = await WebAssembly.instantiate(wasmModule, imports);

  await rubyVM.setInstance(instance);

  printer.setMemory(instance.exports.memory);

  wasi.initialize(instance);

  rubyVM.initialize([
    "ruby.wasm",
    "-e_=0",
    "-EUTF-8",
    `-I${rubyStubsPath}`,
    `-r${defaultStubsPath}`,
    ...args,
  ]);

  return rubyVM;
};
