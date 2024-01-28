// First, create a new file system that we can use internally within the Ruby
// WASM VM.
import path from "path-browserify";
import { gemdir } from "./wasi.ts";
import { Directory, File } from "@bjorn3/browser_wasi_shim";

export const writeGemFile = (filePath: string, buffer: any) => {
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath);
  let dir: Directory = gemdir.dir;
  dirPath.split("/").forEach((dirName) => {
    if (!dir.contents[dirName]) {
      dir.contents[dirName] = new Directory({});
    }
    dir = dir.contents[dirName] as Directory;
  })

  dir.contents[fileName] = new File(buffer);
};

export const gemAlreadyExists = (gemPath: string) => {
  let dir: Directory | undefined = gemdir.dir;
  gemPath.split("/").forEach((dirName) => {
    if (dir?.contents[dirName] instanceof Directory) {
      dir = dir?.contents[dirName] as Directory;
    } else {
      dir = undefined;
    }
  })
  return !!dir;
};
