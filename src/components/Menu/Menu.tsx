import { RefObject } from "react";
import { CreateHandler, DeleteHandler, NodeApi, RenameHandler, Tree, TreeApi } from "react-arborist";
import { Directory, File } from "@bjorn3/browser_wasi_shim";
import { nanoid } from "nanoid";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { VscFileZip, VscNewFile, VscNewFolder } from "react-icons/vsc";

import { decode, encode, workDir } from "../../engines/wasi/editorFS.ts";
import Node from "../Node/Node.tsx";
import { Entity, getPath, idsMap, sortChildren } from "../../fsMap.ts";
import cs from "../Menu/Menu.module.css";

type MenuParams = {
  updateTreeData: () => void;
  setCurrentNodeId: (id: string | null) => void;
  treeRef: RefObject<TreeApi<Entity>>;
  treeData: Entity[];
  currentFilePath: string | null;
}

export const Menu = ({ updateTreeData, setCurrentNodeId, treeRef, treeData, currentFilePath }: MenuParams) => {
  const onRename: RenameHandler<Entity> = ({ name, node }) => {
    const parent = (node.parent == null || node.parent.isRoot) ? workDir.dir : node.parent.data.object as Directory;

    if (node && node.data.name !== name) {
      if (parent.contents[name] !== undefined) {
        throw new Error(`File or directory with name ${name} already exists`);
      }
      parent.contents[name] = node.data.object;
      delete parent.contents[node.data.name];

      updateTreeData();

      setTimeout(() => {
        setCurrentNodeId(node.id);
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
    updateTreeData();
    return { id, name, object };
  };

  const onDelete: DeleteHandler<Entity> = ({ ids }) => {
    ids.forEach((id) => {
      const node = treeRef.current?.get(id);
      if (node) {
        const parent = (node.parent == null || node.parent.isRoot) ? workDir.dir : node.parent.data.object as Directory;
        delete parent.contents[node.data.name];
        if (currentFilePath === getPath(node)) {
          setCurrentNodeId(null);
        }
      }
    });
    updateTreeData();
  };

  const downloadZip = () => {
    const zip = new JSZip();
    const addFile = (dir: Directory, path: string) => {
      Object.entries(dir.contents).forEach(([name, file]) => {
        if (file instanceof Directory) {
          addFile(file, `${path}/${name}`);
        } else {
          zip.file(`${path}/${name}`, decode((file as File).data));
        }
      });
    };
    addFile(workDir.dir, "");
    zip.generateAsync({ type: "blob" }).then((blob) => {
      saveAs(blob, "runruby.zip");
    });
  };

  return (
    <>
      <div className={cs.menuHead}>
        <label className={cs.menuLabel}>Files</label>
        <button
          className={cs.menuButton}
          onClick={() => downloadZip()}
          title="Download as .zip"
        >
          <VscFileZip />
        </button>
        <button
          className={cs.menuButton}
          onClick={() => treeRef.current?.createInternal()}
          title="New Folder..."
        >
          <VscNewFolder />
        </button>
        <button className={cs.menuButton}
                onClick={() => treeRef.current?.createLeaf()} title="New File...">
          <VscNewFile />
        </button>
      </div>
      <Tree
        openByDefault={false}
        data={treeData}
        childrenAccessor={({ object }) => (object instanceof Directory) ? sortChildren(object) : null}
        ref={treeRef}
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
