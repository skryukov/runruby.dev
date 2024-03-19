import { atom, computed, map, onMount } from "nanostores";
import { Entity, sortChildren } from "../fsMap.ts";
import { TreeApi } from "react-arborist";
import { File } from "@bjorn3/browser_wasi_shim";
import { initializeFS, workDir } from "../engines/wasi/wasi.ts";

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

export const refreshTreeData = () => {
  $editor.setKey("treeData", sortChildren(workDir.dir, ""));
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

  const currentFile = currentNode.data.object;
  if (currentFile instanceof File) {
    return currentFile;
  } else {
    return null;
  }
});
