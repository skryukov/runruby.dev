import { Directory, File, SyncOPFSFile } from "@bjorn3/browser_wasi_shim";
import { nanoid } from "nanoid";
import { NodeApi } from "react-arborist";

export type Entity = {
  id: string;
  name: string;
  object: Directory | File | SyncOPFSFile;
}

export const idsMap = new Map<File | Directory | SyncOPFSFile, string>;

export const sortChildren = (node: Directory): Entity[] => {
  const entries = Object.entries(node.contents).map((entry) => {
    const id = idsMap.get(entry[1]) || nanoid();
    idsMap.set(entry[1], id);
    return { id, name: entry[0], object: entry[1] };
  });
  entries.sort((a, b) => {
    if (a.object instanceof Directory && b.object instanceof File) return -1;
    if (b.object instanceof Directory && a.object instanceof File) return 1;
    return a.name < b.name ? -1 : 1;
  });
  return entries;
}

export const getPath = (node: NodeApi<Entity>) => {
  let path = node.data.name;
  let parent = node.parent;
  while (parent && !parent.isRoot) {
    path = `${parent.data.name}/${path}`;
    parent = parent.parent;
  }
  return path;
}
