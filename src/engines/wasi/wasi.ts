import { RubyVM } from "@ruby/wasm-wasi";
import { Fd, PreopenDirectory, File, WASI, OpenFile, ConsoleStdout, Directory } from "@bjorn3/browser_wasi_shim";

import wasmUrl from "@ruby/3.3-wasm-wasi/dist/ruby+stdlib.wasm?url";
import { TRunParams, TSetString } from "../types";
let rubyModule: WebAssembly.Module;

import socketrb from "./../../stubs/socket.rb?url";
import threadrb from "./../../stubs/thread_stub.rb?url";
import rubygemsrb from "./../../stubs/rubygems_stub.rb?url";
import iowaitrb from "./../../stubs/io/wait.rb?url";

export const workdir = new PreopenDirectory(".", {});

export const wasmPathToLib = "/usr/local/lib/ruby_gems";

export const gemdir = new PreopenDirectory(wasmPathToLib, {
  "socket.rb": new File(await (await fetch(socketrb)).arrayBuffer()),
  "thread_stub.rb": new File(await (await fetch(threadrb)).arrayBuffer()),
  "rubygems_stub.rb": new File(await (await fetch(rubygemsrb)).arrayBuffer()),
  "io": new Directory({
    "wait.rb": new File(await (await fetch(iowaitrb)).arrayBuffer()),
  })
})

async function createRuby(setStdout: TSetString, setStderr: TSetString) {

  const fds: Fd[] = [
    new OpenFile(new File([])), // stdin
    ConsoleStdout.lineBuffered(setStdout),
    ConsoleStdout.lineBuffered(setStderr),
    workdir,
    gemdir,
  ];
  const wasi = new WASI([], [], fds, { debug: false });

  // Then, create a new Ruby VM instance that we can use to store the memory for
  // our application.
  const ruby = new RubyVM();
  const imports = {
    wasi_snapshot_preview1: wasi.wasiImport,
  };
  ruby.addToImports(imports);

  if (rubyModule === undefined) {
    rubyModule = await (await fetch(wasmUrl)).arrayBuffer();
  }
  const {instance} = await WebAssembly.instantiate(rubyModule, imports);
  await ruby.setInstance(instance);

  wasi.initialize(instance as any);
  ruby.initialize(["ruby.wasm", "-e_=0", `-I${wasmPathToLib}`, "-rrubygems_stub", "-rthread_stub"]);

  return ruby;
}

export const run = async (params: TRunParams) => {
  const { code, setResult, setStdout, setStderr } = params;
  const vm = await createRuby(setStdout, setStderr);

  const result = await vm.evalAsync(code)
  setResult(result.toString());
};
