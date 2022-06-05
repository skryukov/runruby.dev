// First, create a new file system that we can use internally within the Ruby
// WASM VM.
import { WasmFs } from "@wasmer/wasmfs";
import path from "path-browserify";
import { IFs } from "memfs";
import { TSetString } from "../types";

export const fsPathToLib = "/gems";
export const wasmPathToLib = "/usr/local/lib/ruby_gems";

export const wasiPreopens = { [wasmPathToLib]: fsPathToLib, ".": "/workdir" };

export const writeGemFile = (filePath: string, buffer: any) => {
  const fullFilePath = `${fsPathToLib}/${filePath}`;
  wasmFs.fs.mkdirpSync(path.dirname(fullFilePath), 0o777);
  wasmFs.fs.writeFileSync(fullFilePath, new Uint8Array(buffer), {
    mode: 0o777,
  });
};

export const gemAlreadyExists = (gemPath: string) => {
  const fullPath = `${fsPathToLib}/${gemPath}`;
  return wasmFs.fs.existsSync(fullPath);
};

const patchedWriter = (
  originalWriter: Function,
  onStdout: TSetString,
  onStderr: TSetString
) => {
  return function () {
    const text =
      typeof arguments[1] === "string"
        ? arguments[1]
        : new TextDecoder("utf-8").decode(arguments[1]);

    switch (arguments[0]) {
      case 1:
        onStdout(text);
        break;
      case 2:
        onStderr(text);
        break;
    }

    return originalWriter(...arguments);
  };
};

export const createWasmFs = (): WasmFs => {
  const wasmFs = new WasmFs();
  Object.values(wasiPreopens).forEach((path) => {
    wasmFs.fs.mkdirSync(path, 0o777);
  });

  return wasmFs;
};

export const patchWriter = (
  fs: IFs,
  onStdout: TSetString,
  onStderr: TSetString
) => {
  if (!writerAlreadyPatched) {
    fs.writeSync = patchedWriter(fs.writeSync, onStdout, onStderr);
    writerAlreadyPatched = true;
  }
};

let writerAlreadyPatched = false;

export const wasmFs = createWasmFs();
