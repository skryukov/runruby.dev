import { Directory, File, PreopenDirectory } from "@bjorn3/browser_wasi_shim";

const rubyStubs = import.meta.glob("./**/*.rb", { as: "raw", eager: true });

const getDirectory = (paths: string[], rootDir: PreopenDirectory) => {
  return paths.reduce((acc, pathPart) => {
    if (acc.contents[pathPart] === undefined) {
      acc.contents[pathPart] = new Directory({});
    }
    return acc.contents[pathPart] as Directory;
  }, rootDir.dir);
}

export const generateRubyStubsDir = (path: string) => {
  const rootDir = new PreopenDirectory(path, {});
  const encoder = new TextEncoder();
  for (const [filePath, fileText] of Object.entries(rubyStubs)) {
    const paths = filePath.split("/").slice(1);
    const filename = paths.pop() as string;
    const directory = getDirectory(paths, rootDir);
    directory.contents[filename] = new File(encoder.encode(fileText));
  }
  return rootDir;
}
