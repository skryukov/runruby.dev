import { useCallback, useRef } from "react";
import { CreateHandler, DeleteHandler, NodeApi, RenameHandler, Tree, TreeApi } from "react-arborist";
import { Directory, File } from "@bjorn3/browser_wasi_shim";
import { nanoid } from "nanoid";
import { VscFileZip, VscNewFile, VscNewFolder } from "react-icons/vsc";

import { encode, workDir } from "../../engines/wasi/editorFS.ts";
import { Node } from "../Node/Node.tsx";
import { Entity, getPath, idsMap, sortChildren } from "../../fsMap.ts";
import cs from "../Menu/Menu.module.css";
import {
  $editor,
  $editorVersion,
  currentFilePathStore,
  refreshTreeData,
  setCurrentNodeId,
  setTree
} from "../../stores/editor.ts";
import { downloadZip } from "../../downloadZip.ts";
import { useStore } from "@nanostores/react";

export const Menu = () => {
  const { treeData, tree } = useStore($editor);
  const currentFilePath = useStore(currentFilePathStore);

  const onRename: RenameHandler<Entity> = ({ name, node }) => {
    const parent = (node.parent == null || node.parent.isRoot) ? workDir.dir : node.parent.data.object as Directory;

    if (node && node.data.name !== name) {
      if (parent.contents[name] !== undefined) {
        throw new Error(`File or directory with name ${name} already exists`);
      }
      parent.contents[name] = node.data.object;
      delete parent.contents[node.data.name];
      refreshTreeData();

      setTimeout(() => {
        $editorVersion.set($editorVersion.get() + 1);
      }, 20);
    }
  };

  const onCreate: CreateHandler<Entity> = ({ parentNode, type }) => {
    const parent = (parentNode?.data?.object || workDir.dir) as Directory;
    const object = (type === "leaf") ? new File(encode("")) : new Directory({});
    const name = (type === "leaf") ? `new_file_${Date.now()}.rb` : `new_dir_${Date.now()}`;
    parent.contents[name] = object;
    const id = nanoid();
    idsMap.set(object, id);
    refreshTreeData();
    return { id, name, object };
  };

  const onDelete: DeleteHandler<Entity> = ({ ids }) => {
    ids.forEach((id) => {
      const node = tree?.get(id);
      if (node) {
        const parent = (node.parent == null || node.parent.isRoot) ? workDir.dir : node.parent.data.object as Directory;
        delete parent.contents[node.data.name];
        if (currentFilePath === getPath(node)) {
          setCurrentNodeId(null);
        }
      }
    });
    refreshTreeData();
  };

  const treeRefSet = useRef(false);
  const setTreeRef = useCallback((tree: TreeApi<Entity>) => {
    if (treeRefSet.current) return;
    treeRefSet.current = true;
    setTree(tree);
  }, []);

  return (
    <>
      <div className={cs.menuHead}>
        <label className={cs.menuLabel}>Files</label>
        <button
          className={cs.menuButton}
          onClick={downloadZip}
          title="Download as .zip"
        >
          <VscFileZip />
        </button>
        <button
          className={cs.menuButton}
          onClick={() => tree?.createInternal()}
          title="New Folder..."
        >
          <VscNewFolder />
        </button>
        <button className={cs.menuButton}
                onClick={() => tree?.createLeaf()} title="New File...">
          <VscNewFile />
        </button>
      </div>
      <Tree
        width="100%"
        openByDefault={false}
        data={treeData}
        childrenAccessor={({ object }) => (object instanceof Directory) ? sortChildren(object) : null}
        ref={setTreeRef as never}
        disableDrag={true}
        disableDrop={true}
        onRename={onRename}
        onCreate={onCreate}
        onDelete={onDelete}
        onActivate={(node: NodeApi) => {
          if (node.isLeaf) {
            setCurrentNodeId(node.id);
          }
        }}
      >
        {Node}
      </Tree>
    </>
  );
};
