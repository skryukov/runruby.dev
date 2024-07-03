import { Directory, File, SyncOPFSFile } from "@bjorn3/browser_wasi_shim";
import { nanoid } from "nanoid";
import { setDirty } from "./stores/editor.ts";

export type Entity = {
  id: string;
  name: string;
  fullPath: string;
  object: Directory | File | SyncOPFSFile;
}

export const idsMap = new Map<File | Directory | SyncOPFSFile, string>;

export const sortChildren = (node: Directory, nodePath: string): Entity[] => {
  const entries = Array.from(node.contents.entries()).map(([key, value]) => {
    if (!(value instanceof Directory || value instanceof File || value instanceof SyncOPFSFile)) {
      throw new Error(`Unexpected type in directory contents: ${key}`);
    }

    const id = idsMap.get(value);
    const result = { id: id || nanoid(), name: key, fullPath: `${nodePath ? nodePath + '/' : ''}${key}`, object: value };
    if (!id) {
      setDirty(result.fullPath);
    }
    idsMap.set(value, result.id);
    return result;
  });

  entries.sort((a, b) => {
    if (a.object instanceof Directory && b.object instanceof File) return -1;
    if (b.object instanceof Directory && a.object instanceof File) return 1;
    return a.name < b.name ? -1 : 1;
  });

  return entries;
};
