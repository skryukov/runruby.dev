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
  const entries = Object.entries(node.contents).map((entry) => {
    const id = idsMap.get(entry[1]);
    const result = { id: id || nanoid(), name: entry[0], fullPath: `${nodePath ? nodePath + '/' : ''}${entry[0]}`, object: entry[1] };
    if (!id) {
      setDirty(result.fullPath);
    }
    idsMap.set(entry[1], result.id);
    return result;
  });
  entries.sort((a, b) => {
    if (a.object instanceof Directory && b.object instanceof File) return -1;
    if (b.object instanceof Directory && a.object instanceof File) return 1;
    return a.name < b.name ? -1 : 1;
  });
  return entries;
};
