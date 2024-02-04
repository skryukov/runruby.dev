import { Directory } from "@bjorn3/browser_wasi_shim";
import { useState } from "react";

import cs from "./styles.module.css";

const DirItem = ({ path, rootDir, currentFilePath, setCurrentFilePath }: {
  currentFilePath: string,
  setCurrentFilePath: (value: (((prevState: string) => string) | string)) => void,
  rootDir: Directory
  path: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={cs.menuFolder} key={path}>
      <div className={cs.menuFolderName}
           onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "▼" : "▶"}&nbsp;&nbsp;{path}
        <div className={cs.menuFileButtons}>
          <div className={cs.menuFileButton}>[+ dir]</div>
          <div className={cs.menuFileButton}>[+ file]</div>
          <div className={cs.menuFileButton}>[edit]</div>
          <div className={cs.menuFileButton}>[del]</div>
        </div>
      </div>
      {isOpen && <div className={cs.menuFolderContent}>
        <FileTree
          rootDir={rootDir.contents[path] as Directory}
          currentFilePath={currentFilePath}
          setCurrentFilePath={setCurrentFilePath}
          rootPath={path}
        />
      </div>
      }
    </div>
  );
};

export const FileTree = ({ currentFilePath, setCurrentFilePath, rootDir, rootPath }: {
  currentFilePath: string,
  setCurrentFilePath: (value: (((prevState: string) => string) | string)) => void,
  rootDir: Directory
  rootPath?: string
}) => {
  return (
    <div className={cs.menuFiles}>
      {rootPath ? null :
        <label className={cs.menuLabel}>
          Files
          <div className={cs.menuFileButtons}>
            <div className={cs.menuFileButton}>[+ dir]</div>
            <div className={cs.menuFileButton}>[+ file]</div>
          </div>
        </label>
      }
      {Object.keys(rootDir.contents).map((path) => (
        (rootDir.contents[path] instanceof Directory) ?
          <DirItem
            currentFilePath={currentFilePath}
            setCurrentFilePath={setCurrentFilePath}
            rootDir={rootDir}
            path={path}
          />
          :
          <div
            className={`${cs.menuFile} ${currentFilePath === `${rootPath ? `${rootPath}/` : ""}${path}` ? cs.menuFileActive : ""}`}
            key={path} onClick={() => {
            setCurrentFilePath(`${rootPath ? `${rootPath}/` : ""}${path}`);
          }}>
            {path}
            <div className={cs.menuFileButtons}>
              <div className={cs.menuFileButton}>[edit]</div>
              <div className={cs.menuFileButton}>[del]</div>
            </div>
          </div>
      ))}
    </div>
  );
};
