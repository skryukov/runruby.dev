import { atom, computed, map, onMount } from "nanostores";
import { Entity } from "../fsMap.ts";
import { TreeApi } from "react-arborist";
import { File } from "@bjorn3/browser_wasi_shim";
import { initializeFS } from "../engines/wasi/wasi.ts";
import { webcontainerInstance } from "../engines/webcontainers";

type EditorStoreValue = {
  currentNodeId: string | null;
  treeData: Entity[];
  code: string | null;
  tree: TreeApi<Entity> | null;
  dirtyFiles: string[];
};

export const $editor = map<EditorStoreValue>({
  currentNodeId: null,
  treeData: [],
  code: null,
  tree: null,
  dirtyFiles: [],
});

export const $editorVersion = atom(0);

onMount($editor, () => {
  initializeFS().then(refreshTreeData).then(cleanDirty);
});

export const getDirFiles = async (path: string) => {
  while (!webcontainerInstance) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const files = await webcontainerInstance?.fs?.readdir(path, {
    withFileTypes: true,
  });
  const result: Entity[] = [];
  for (const file of files) {
    result.push({
      id: file.name,
      name: file.name,
      fullPath: `${path}/${file.name}`,
      children: file.isDirectory()
        ? await getDirFiles(`${path}/${file.name}`)
        : undefined,
    });
  }
  return result;
};

export const refreshTreeData = async () => {
  $editor.setKey("treeData", await getDirFiles(""));
};

export const setCurrentNodeId = (id: string | null) => {
  $editor.setKey("currentNodeId", id);
};

export const setCode = (code: string | null) => {
  const currentNodeId = $editor.get().currentNodeId;
  if (currentNodeId === null) return;

  $editor.setKey("code", code);
};

export const setDirty = (path: string) => {
  const newDirtyFiles = [...new Set([...$editor.get().dirtyFiles, path])];
  $editor.setKey("dirtyFiles", newDirtyFiles);
};

export const cleanDirty = () => {
  $editor.setKey("dirtyFiles", []);
};

export const setTree = (tree: TreeApi<Entity>) => {
  $editor.setKey("tree", tree);
};

export const currentFilePathStore = computed(
  [$editor, $editorVersion],
  (editor) => {
    const currentNode = editor.tree?.get(editor.currentNodeId);
    return currentNode ? currentNode.data.fullPath : null;
  },
);

export const currentFileStore = computed($editor, (editor) => {
  if (editor.currentNodeId === null) return null;

  const currentNode = editor.tree?.get(editor.currentNodeId);
  if (!currentNode) return null;

  const currentFile = currentNode.data;
  if (currentFile instanceof File) {
    return currentFile;
  } else {
    return null;
  }
});
