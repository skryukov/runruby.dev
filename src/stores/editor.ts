import { action, atom, computed, map, onMount } from "nanostores";
import { Entity, getPath, sortChildren } from "../fsMap.ts";
import { workDir } from "../engines/wasi/editorFS.ts";
import { TreeApi } from "react-arborist";
import { File } from "@bjorn3/browser_wasi_shim";

type EditorStoreValue = {
  currentNodeId: string | null;
  treeData: Entity[];
  code: string | null;
  tree: TreeApi<Entity> | null;
}
export const $editor = map<EditorStoreValue>({
  currentNodeId: null,
  treeData: [],
  code: null,
  tree: null
});

export const $editorVersion = atom(0);

onMount($editor, () => {
  refreshTreeData();
});

export const refreshTreeData = action($editor, "refreshTreeData", (store) => {
  store.setKey("treeData", sortChildren(workDir.dir));
});

export const setCurrentNodeId = action($editor, "setCurrentNodeId", (store, id: string | null) => {
  store.setKey("currentNodeId", id);
});

export const setCode = action($editor, "setCode", (store, code: string | null) => {
  store.setKey("code", code);
});


export const setTree = action($editor, "setTree", (store, tree: TreeApi<Entity>) => {
  store.setKey("tree", tree);
});

export const currentFilePathStore = computed([$editor, $editorVersion], editor => {
  const currentNode = editor.tree?.get(editor.currentNodeId);
  return currentNode ? getPath(currentNode) : null;
});

export const currentFileStore = computed($editor, editor => {
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
