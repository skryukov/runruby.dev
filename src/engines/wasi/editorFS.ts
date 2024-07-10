import { Directory, File } from "@bjorn3/browser_wasi_shim";
import { GistFile } from "../../gist.ts";
import { workDir } from "./wasi.ts";
import { setDirty } from "../../stores/editor.ts";

export const encode = (() => {
  const encoder = new TextEncoder();
  return (str: string) => encoder.encode(str);
})();

export const decode = (() => {
  const decoder = new TextDecoder();
  return (buffer: Uint8Array) => decoder.decode(buffer);
})();

export interface FSFile {
  filename: string;
  contents: string;
}

export const walkFileTree = (cb: ({ filename, contents }: FSFile) => void) => {
  const walk = (dir: Directory, path: string) => {
    for (const [name, file] of dir.contents.entries()) {
      if (file instanceof Directory) {
        walk(file, `${path}/${name}`);
      } else {
        cb({
          filename: `${path ? path + "/" : ""}${name}`,
          contents: decode((file as File).data),
        });
      }
    }
  };

  walk(workDir.dir, "");
};

export const writeFiles = ({ files }: { files: GistFile[] }) => {
  files.forEach(({ filename, content }) => {
    writeFile(filename, content);
  });
};

export const rename = (oldPath: string, newPath: string) => {
  if (oldPath === newPath) return false;

  const parts = oldPath.split("/");
  const oldName = parts.pop() as string;
  const oldDir = findDir(parts);
  if (oldDir.contents.get(oldName) === undefined) {
    throw new Error(`File or directory with name ${oldName} doesn't exist`);
  }

  const newParts = newPath.split("/");
  const newName = newParts.pop() as string;
  const newDir = findDir(newParts);
  if (newDir.contents.get(newName) !== undefined) {
    throw new Error(`File or directory with name ${newName} already exists`);
  }

  const inode = oldDir.contents.get(oldName);
  if (inode !== undefined) {
    newDir.contents.set(newName, inode);
    oldDir.contents.delete(oldName);
  } else {
    console.error(`${oldName} not found in oldDir.contents`);

    return false;
  }

  if (newDir.contents.get(newName) instanceof File) {
    setDirty(newPath);
  }

  return true;
};

export const mkdir = (path: string) => {
  const parts = path.split("/");
  const name = parts.pop() as string;
  const dir = findDir(parts);

  if (!name) return dir;

  if (dir.contents.get(name) !== undefined) {
    throw new Error(`File or directory with name ${name} already exists`);
  }

  dir.contents.set(name, new Directory([]));

  return dir.contents.get(name) as Directory;
};

export const writeFile = (path: string, contents: string) => {
  const parts = path.split("/");
  const name = parts.pop() as string;
  const dir = findDir(parts);

  if (dir.contents.get(name) instanceof Directory) {
    throw new Error(`File or directory with name ${name} already exists`);
  }

  if (dir.contents.get(name) === undefined) {
    dir.contents.set(name, new File(encode(contents)));
  } else {
    (dir.contents.get(name) as File).data = encode(contents);
  }

  setDirty(path);

  return dir.contents.get(name) as File;
};

export const rm = (path: string) => {
  const parts = path.split("/");
  const name = parts.pop() as string;
  const dir = findDir(parts);

  if (dir.contents.get(name) === undefined) {
    throw new Error(`File or directory with name ${name} doesn't exist`);
  }

  setDirty(path);

  dir.contents.delete(name);
};

const findDir = (parts: string[]) => {
  return parts.reduce((dir, part) => {
    if (!part) return dir;

    if (!dir.contents.get(part)) {
      dir.contents.set(part, new Directory([]));
    }
    return dir.contents.get(part) as Directory;
  }, workDir.dir);
};
