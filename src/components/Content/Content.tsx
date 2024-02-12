import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TreeApi } from "react-arborist";

import { workDir } from "../../engines/wasi/editorFS.ts";

import { Entity, getPath, sortChildren } from "../../fsMap.ts";
import { useVM } from "../../useVM.ts";
import { Output, OutputTab } from "../Output/Output.tsx";
import { Editor } from "../Editor/Editor.tsx";
import { Menu } from "../Menu/Menu.tsx";
import cs from "./Content.module.css";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DirectoryContents, mapToEntities } from "../../db.ts";
import { bundleDir, gemsDir } from "../../engines/wasi/wasi.ts";

export const Content = () => {
  const [outputTab, setOutputTab] = useState<OutputTab>("result");
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [treeData, setTreeData] = useState(sortChildren(workDir.dir));
  const treeRef = useRef<TreeApi<Entity>>(null);
  const { loading, log, result, runVM } = useVM();

  const gemsDirContent = useLiveQuery(
    () => db.fsCache.get({key: "gemsDir"}),
    []
  );
  const bundleDirContent = useLiveQuery(
    () => db.fsCache.get({key: "bundleDir"}),
    []
  );

  const populatedGemsDir = useRef(false);
  useEffect(() => {
    if (gemsDirContent && bundleDirContent && !populatedGemsDir.current) {
      gemsDir.dir.contents = mapToEntities(gemsDirContent.data as DirectoryContents);
      bundleDir.dir.contents = mapToEntities(bundleDirContent.data as DirectoryContents);
      populatedGemsDir.current = true;
    }
  }, [gemsDirContent, bundleDirContent, populatedGemsDir]);


  const updateTreeData = useCallback(() => {
    setTreeData(sortChildren(workDir.dir));
  }, []);

  const currentFilePath = useMemo(() => {
    const currentNode = treeRef.current?.get(currentNodeId);
    return currentNode ? getPath(currentNode) : null;
  }, [currentNodeId]);

  return (
    <>
      <div className={cs.menu}>
        <Menu
          treeRef={treeRef}
          treeData={treeData}
          currentFilePath={currentFilePath}
          setCurrentNodeId={setCurrentNodeId}
          updateTreeData={updateTreeData}
        />
      </div>

      <div className={cs.editor}>
        <Editor
          loading={loading}
          treeRef={treeRef}
          treeData={treeData}
          currentFilePath={currentFilePath}
          updateTreeData={updateTreeData}
          setOutputTab={setOutputTab}
          runVM={runVM}
        />
      </div>
      <div className={cs.output}>
        <Output
          log={log}
          result={result}
          outputTab={outputTab}
          setOutputTab={setOutputTab}
        />
      </div>
    </>
  );
};

