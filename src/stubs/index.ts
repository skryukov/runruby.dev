import {
  Directory,
  File,
  Inode,
  PreopenDirectory,
} from "@bjorn3/browser_wasi_shim";

const rubyStubs = import.meta.glob("./**/*.rb", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const getDirectory = (paths: string[], rootDir: PreopenDirectory) => {
  return paths.reduce((acc, pathPart) => {
    if (acc.contents.get(pathPart) === undefined) {
      acc.contents.set(pathPart, new Directory([]));
    }
    return acc.contents.get(pathPart) as Directory;
  }, rootDir.dir);
};

export const generateRubyStubsDir = (path: string) => {
  const emptyMap = new Map<string, Inode>();
  const rootDir = new PreopenDirectory(path, emptyMap);
  const encoder = new TextEncoder();
  for (const [filePath, fileText] of Object.entries(rubyStubs)) {
    const paths = filePath.split("/").slice(1);
    const filename = paths.pop() as string;
    const directory = getDirectory(paths, rootDir);
    directory.contents.set(filename, new File(encoder.encode(fileText)));
  }
  return rootDir;
};
