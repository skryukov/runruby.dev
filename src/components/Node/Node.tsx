import { NodeRendererProps, NodeApi } from "react-arborist";
import { VscEdit, VscFile, VscFolder, VscFolderOpened, VscTrash } from "react-icons/vsc";

import { Entity } from "../../fsMap.ts";
import cs from "./Node.module.css";

function isValidFileName(fileName: string) {
  if (fileName.trim() === "") {
    return false;
  }
  const invalidCharacters = ["<", ">", ":", "\"", "/", "\\", "|", "?", "*"];
  for (let i = 0; i < invalidCharacters.length; i++) {
    if (fileName.includes(invalidCharacters[i])) {
      return false;
    }
  }
  return !(fileName.startsWith(" ") || fileName.endsWith(" "));
}

function submitNodeName(node: NodeApi<Entity>, value: string) {
  if (isValidFileName(value)) {
    node.submit(value);
  }
}

const Node = ({ node, style, dragHandle, tree }: NodeRendererProps<Entity>) => {
  return (
    <div
      className={`${cs.nodeContainer} ${node.isSelected ? cs.isSelected : ""}`}
      style={style}
      ref={dragHandle}
    >
      <div
        className={cs.nodeContent}
        onClick={() => node.isInternal && node.toggle()}
      >
        <span className={cs.fileFolderIcon}>
        {node.isLeaf ? (
          <VscFile />
        ) : (
          node.isOpen ? (
            <VscFolderOpened />
          ) : (
            <VscFolder />
          )
        )}
          </span>
        <span className={cs.nodeText}>
          {node.isEditing ? (
            <input
              type="text"
              defaultValue={node.data.name}
              onFocus={(e) => {
                if (node.isLeaf) {
                  e.currentTarget.setSelectionRange(0, node.data.name.lastIndexOf("."));
                } else {
                  e.currentTarget.select();
                }
              }}
              onBlur={(e) => submitNodeName(node, e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") node.reset();
                if (e.key === "Enter") submitNodeName(node, e.currentTarget.value);
              }}
              autoFocus
            />
          ) : (
            <span>{node.data.name}</span>
          )}
        </span>
      </div>

      <div className={cs.fileActions}>
        <div className={cs.folderFileActions}>
          <button onClick={() => node.edit()} title="Rename...">
            <VscEdit />
          </button>
          <button onClick={(e) => {
            if (window.confirm(`Are you sure you want to delete this ${node.isLeaf ? "file" : "folder"}?`)) {
              tree.delete(node.id);
            }
            e.stopPropagation();
          }} title="Delete...">
            <VscTrash />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Node;
