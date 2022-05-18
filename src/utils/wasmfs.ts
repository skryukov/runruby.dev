// First, create a new file system that we can use internally within the Ruby
// WASM VM.
import { WasmFs } from "@wasmer/wasmfs";

export const fsPathToLib = "/gems";
export const wasmPathToLib = "/usr/local/lib/ruby_gems";

export const wasiPreopens = { [wasmPathToLib]: fsPathToLib, ".": "/workdir" };

const patchedWriter = (originalWriter: Function) => {
  return function () {
    const text =
      typeof arguments[1] === "string"
        ? arguments[1]
        : new TextDecoder("utf-8").decode(arguments[1]);

    switch (arguments[0]) {
      case 1:
        console.log(text);
        break;
      case 2:
        console.warn(text);
        break;
    }

    return originalWriter(...arguments);
  };
};

const createWasmFs = (): WasmFs => {
  const wasmFs = new WasmFs();
  wasmFs.fs.writeSync = patchedWriter(wasmFs.fs.writeSync);
  Object.values(wasiPreopens).forEach((path) => {
    wasmFs.fs.mkdirSync(path, 0o777);
  });

  return wasmFs;
};

export const wasmFs = createWasmFs();
