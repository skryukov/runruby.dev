import pako from "pako";
import { RubyVM } from "ruby-head-wasm-wasi";
// @ts-ignore
import untar from "js-untar";

import { gemAlreadyExists, wasmPathToLib, writeGemFile } from "./wasmfs";

// TODO:
//  This is a hack to get around the fact that rubygems doesn't allow
//  downloading gems from a browser due to lack of CORS headers
const fetchGem = async (name: string, version: string) => {
  const response = await fetch(`${name}-${version}.gem`);
  if (!response.ok) {
    console.log("error", response);
    return null;
  }

  const blob = await response.blob();
  return blob.arrayBuffer();
};

const unzipCode = async (buffer: ArrayBuffer, gemPath: string) => {
  const gemFiles = await untar(buffer);
  const data = gemFiles.find((e: any) => e.name === "data.tar.gz");
  const dataTar = pako.inflate(data.buffer).buffer;

  const dataFiles = await untar(dataTar);
  dataFiles.forEach((file: any) => {
    const filePath = `${gemPath}/${file.name}`;
    writeGemFile(filePath, file.buffer);
  });
};

export async function installGem(
  rubyVM: RubyVM,
  gemName: string,
  gemVersion: string
) {
  const gemPath = `${gemName}-${gemVersion}`;
  if (!gemAlreadyExists(gemPath)) {
    const gemData = await fetchGem(gemName, gemVersion);
    if (!gemData) {
      return;
    }
    await unzipCode(gemData, gemPath);
  }
  rubyVM.eval(`$LOAD_PATH << '${wasmPathToLib}/${gemPath}/lib'`);
}
