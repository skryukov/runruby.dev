import path from "path-browserify";
import { WASI } from "@wasmer/wasi";
import { RubyVM } from "ruby-head-wasm-wasi";

import { wasiPreopens, wasmFs } from "./wasmfs";

import wasmUrl from "ruby-head-wasm-wasi/dist/ruby+stdlib.wasm?url";

export async function createRuby() {
  // Next, create a new WASI instance with the correct options overridden from
  // the defaults.
  const wasi = new WASI({
    bindings: { ...WASI.defaultBindings, fs: wasmFs.fs, path: path },
    preopens: wasiPreopens,
  });

  // Then, create a new Ruby VM instance that we can use to store the memory for
  // our application.
  const ruby = new RubyVM();
  const imports = { wasi_snapshot_preview1: wasi.wasiImport };
  ruby.addToImports(imports);

  // Set the WASI memory to use the memory for our application.
  // const instance = await wasmInit(imports);
  const rubyModule = await (await fetch(wasmUrl)).arrayBuffer();
  const result = await WebAssembly.instantiate(rubyModule, imports);
  const instance = result.instance;

  await ruby.setInstance(instance);

  // Initial our virtual machine and return it. It should now be able to
  // evaluate and execute Ruby code.
  wasi.setMemory(instance.exports.memory as WebAssembly.Memory);
  // Manually call `_initialize`, which is a part of reactor model ABI,
  // because the WASI polyfill doesn't support it yet.
  instance.exports._initialize();
  ruby.initialize();

  return ruby;
}

export const rubyVM = await createRuby();
