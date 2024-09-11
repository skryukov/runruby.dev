import { useCallback, useRef } from "react";
import {
  CreateHandler,
  DeleteHandler,
  NodeApi,
  RenameHandler,
  Tree,
  TreeApi,
} from "react-arborist";
import { nanoid } from "nanoid";
import {
  VscFileZip,
  VscLinkExternal,
  VscNewFile,
  VscNewFolder,
} from "react-icons/vsc";
import { useStore } from "@nanostores/react";

import { rm } from "../../engines/wasi/editorFS.ts";
import { Node } from "../Node/Node.tsx";
import { Entity } from "../../fsMap.ts";
import cs from "../Menu/Menu.module.css";
import {
  $editor,
  $editorVersion,
  currentFilePathStore,
  refreshTreeData,
  setCurrentNodeId,
  setTree,
} from "../../stores/editor.ts";
import { $gist } from "../../stores/gists.ts";
import { downloadZip } from "../../downloadZip.ts";
import { webcontainerInstance } from "../../engines/webcontainers";

export const Menu = () => {
  const { treeData, tree } = useStore($editor);
  const currentFilePath = useStore(currentFilePathStore);

  const onRename: RenameHandler<Entity> = async ({ name, node }) => {
    const oldPath = node.data.fullPath;
    const newPath = oldPath.replace(new RegExp(`${node.data.name}$`), name);

    await webcontainerInstance?.fs?.rename(oldPath, newPath);
    // TODO check if needed
    $editorVersion.set($editorVersion.get() + 1);
  };

  const onCreate: CreateHandler<Entity> = async ({ parentNode, type }) => {
    const name =
      type === "leaf" ? `new_file_${Date.now()}.rb` : `new_dir_${Date.now()}`;
    const path = `${parentNode ? parentNode.data.fullPath : ""}/${name}`;
    if (type === "leaf") {
      await webcontainerInstance?.fs?.writeFile(path, "");
    } else {
      await webcontainerInstance?.fs?.mkdir(path);
    }

    // const object = (type === "leaf") ? writeFile(path, "") : mkdir(path);
    //
    // const id = nanoid();
    // idsMap.set(object, id);
    // refreshTreeData();
    return { id: nanoid(), name, object: null };
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
            <a
              className={cs.gistLink}
              target="_blank"
              href={`https://gist.github.com/${gist.username}/${gist.id}`}
            >
              open gist <VscLinkExternal />
            </a>
          </div>
          <div className={cs.userInfo}>
            <img
              className={cs.avatar}
              src={gist.avatarUrl}
              alt={gist.username}
            />
            {gist.username}
          </div>
          {gist.description && (
            <p className={cs.gistDescription}>{gist.description}</p>
          )}
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
        <button
          className={cs.menuButton}
          onClick={() => tree?.createLeaf()}
          title="New File..."
        >
          <VscNewFile />
        </button>
      </div>
      <Tree
        width="100%"
        openByDefault={false}
        data={treeData}
        ref={setTreeRef as never}
        disableDrag={true}
        disableDrop={true}
        onRename={onRename}
        onCreate={onCreate}
        onDelete={onDelete}
        onActivate={(node: NodeApi<Entity>) => {
          if (node.isLeaf) {
            setCurrentNodeId(node.data.fullPath);
          }
        }}
      >
        {Node}
      </Tree>
    </>
  );
};
