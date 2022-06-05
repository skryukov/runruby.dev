import path from "path-browserify";
import { WASI } from "@wasmer/wasi";
import { RubyVM } from "ruby-head-wasm-wasi";

import { patchWriter, wasiPreopens, wasmFs } from "./wasmfs";

import wasmUrl from "ruby-head-wasm-wasi/dist/ruby+stdlib.wasm?url";
import { installGem } from "./installGem";
import { TRunParams, TSetString } from "../types";

const patchedWasiImport = {
  // fixes 'Function not implemented' error on requiring gems from mounted FS
  // see https://github.com/ruby/ruby.wasm/issues/17
  fd_fdstat_set_flags: () => 0,
};

let rubyModule: ArrayBuffer;

async function createRuby(setStdout: TSetString, setStderr: TSetString) {
  patchWriter(wasmFs.fs, setStdout, setStderr);
  // Next, create a new WASI instance with the correct options overridden from
  // the defaults.
  const wasi = new WASI({
    bindings: { ...WASI.defaultBindings, fs: wasmFs.fs, path: path },
    preopens: wasiPreopens,
  });

  // Then, create a new Ruby VM instance that we can use to store the memory for
  // our application.
  const ruby = new RubyVM();
  const imports = {
    wasi_snapshot_preview1: { ...wasi.wasiImport, ...patchedWasiImport },
  };
  ruby.addToImports(imports);

  // Set the WASI memory to use the memory for our application.
  if (rubyModule === undefined) {
    rubyModule = await (await fetch(wasmUrl)).arrayBuffer();
  }
  const result = await WebAssembly.instantiate(rubyModule, imports);
  const instance = result.instance;

  await ruby.setInstance(instance);

  // Initial our virtual machine and return it. It should now be able to
  // evaluate and execute Ruby code.
  wasi.setMemory(instance.exports.memory as WebAssembly.Memory);
  // Manually call `_initialize`, which is a part of reactor model ABI,
  // because the WASI polyfill doesn't support it yet.
  // @ts-ignore
  instance.exports._initialize();
  await ruby.initialize(["ruby.wasm", "-e_=0"]);

  return ruby;
}

export const run = async (params: TRunParams) => {
  const { code, setResult, setStdout, setStderr } = params;
  const vm = await createRuby(setStdout, setStderr);
  await installGem(vm, "dry-initializer", "3.1.1");

  setResult(vm.eval(code).toString());
};
