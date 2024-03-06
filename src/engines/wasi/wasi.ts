import { RubyVM } from "@ruby/wasm-wasi";
import wasmUrl from "@ruby/3.3-wasm-wasi/dist/ruby+stdlib.wasm?url";
import { Fd, PreopenDirectory, File, WASI, OpenFile, ConsoleStdout } from "@bjorn3/browser_wasi_shim";

import { wasiImports } from "./wasiImports";
import { TRunParams, TSetString } from "../types";
import { generateRubyStubsDir } from "../../stubs";
import { writeFiles } from "./editorFS.ts";
import { composeInitialFS } from "../../fsInitializer.ts";

const wasmModulePromise = fetch(wasmUrl).then((response) => WebAssembly.compileStreaming(response));

const rubyStubsPath = "/usr/local/lib/ruby_gems";

export const gemsDir = new PreopenDirectory("/gems", {});
export const bundleDir = new PreopenDirectory("/.bundle", {});
export const workDir: PreopenDirectory = new PreopenDirectory("/", {});

let FSInitialized = false;

export const initializeFS = async () => {
  if (FSInitialized) return;
  FSInitialized = true;

  const fs = await composeInitialFS();
  writeFiles(fs);
};

const dirFds = [
  generateRubyStubsDir(rubyStubsPath),
  bundleDir,
  gemsDir
];

async function createRuby(setStdout: TSetString, setStderr: TSetString) {
  const fds: Fd[] = [
    new OpenFile(new File([])), // stdin
    ConsoleStdout.lineBuffered(setStdout),
    ConsoleStdout.lineBuffered(setStderr),
    workDir,
    ...dirFds
  ];
  const wasi = new WASI([], [], fds, { debug: false });

  // Then, create a new Ruby VM instance that we can use to store the memory for
  // our application.
  const ruby = new RubyVM();
  const imports = wasiImports(wasi, { debug: false });
  ruby.addToImports(imports);

  const instance = await WebAssembly.instantiate(await wasmModulePromise, imports);
  await ruby.setInstance(instance);

  wasi.initialize(instance as never);
  ruby.initialize(["ruby.wasm", "-e_=0", `-I${rubyStubsPath}`, `-rdefault_stubs`]);

  return ruby;
}

export const run = async (params: TRunParams) => {
  const { code, setResult, setStdout, setStderr } = params;
  const vm = await createRuby(setStdout, setStderr);
  const jsResult = await vm.evalAsync(code);
  const result = jsResult.toString();
  setResult(result);
  return jsResult;
};
