import { useCallback, useRef } from "react";
import { CreateHandler, DeleteHandler, NodeApi, RenameHandler, Tree, TreeApi } from "react-arborist";
import { Directory } from "@bjorn3/browser_wasi_shim";
import { nanoid } from "nanoid";
import { VscFileZip, VscLinkExternal, VscNewFile, VscNewFolder } from "react-icons/vsc";
import { useStore } from "@nanostores/react";

import { mkdir, rename, rm, writeFile } from "../../engines/wasi/editorFS.ts";
import { Node } from "../Node/Node.tsx";
import { Entity, idsMap, sortChildren } from "../../fsMap.ts";
import cs from "../Menu/Menu.module.css";
import {
  $editor,
  $editorVersion,
  currentFilePathStore,
  refreshTreeData,
  setCurrentNodeId,
  setTree
} from "../../stores/editor.ts";
import { $gist } from "../../stores/gists.ts";
import { downloadZip } from "../../downloadZip.ts";

export const Menu = () => {
  const { treeData, tree } = useStore($editor);
  const currentFilePath = useStore(currentFilePathStore);

  const onRename: RenameHandler<Entity> = ({ name, node }) => {
    const oldPath = node.data.fullPath;
    const newPath = oldPath.replace(new RegExp(`${node.data.name}$`), name);

    if (rename(oldPath, newPath)) {
      refreshTreeData();

      setTimeout(() => {
        $editorVersion.set($editorVersion.get() + 1);
      }, 20);
    }
  };

  const onCreate: CreateHandler<Entity> = ({ parentNode, type }) => {
    const name = (type === "leaf") ? `new_file_${Date.now()}.rb` : `new_dir_${Date.now()}`;
    const path = `${parentNode ? parentNode.data.fullPath : ""}/${name}`;
    const object = (type === "leaf") ? writeFile(path, "") : mkdir(path);

    const id = nanoid();
    idsMap.set(object, id);
    refreshTreeData();
    return { id, name, object };
  };

  const onDelete: DeleteHandler<Entity> = ({ ids }) => {
    ids.forEach((id) => {
      const node = tree?.get(id);
      if (node) {
        rm(node.data.fullPath);
        if (currentFilePath === node.data.fullPath) {
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

  const gist = useStore($gist);

  return (
    <>
      {gist.id && (
        <div className={cs.gistInfo}>
          <div className={cs.gistLabel}>
            Gist info
            <a className={cs.gistLink} target="_blank" href={`https://gist.github.com/${gist.username}/${gist.id}`}>open
              gist <VscLinkExternal /></a>
          </div>
          <div className={cs.userInfo}>
            <img className={cs.avatar} src={gist.avatarUrl} alt={gist.username} />
            {gist.username}
          </div>
          {gist.description && (<p className={cs.gistDescription}>
            {gist.description}
          </p>)}
        </div>
      )}

      <div className={cs.menuHead}>
        <div className={cs.menuLabel}>Files</div>
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
        childrenAccessor={({ object, fullPath }) => (object instanceof Directory) ? sortChildren(object, fullPath) : null}
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
