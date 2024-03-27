import { useEffect, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { useStore } from "@nanostores/react";

import { decode } from "../../engines/wasi/editorFS.ts";
import {
  currentFilePathStore,
  currentFileStore,
  setCode
} from "../../stores/editor.ts";
import { useEditorTheme } from "../../useEditorTheme.ts";

import cs from "./Editor.module.css";
import { webcontainerInstance } from "../../engines/webcontainers";

export const Editor = () => {
  const [editorInitializing, setInitializing] = useState(true);

  const currentFilePath = useStore(currentFilePathStore);
  const currentFile = useStore(currentFileStore);

  // const activateFirstFile = useCallback(() => {
  //   if (tree) {
  //     const node = tree.visibleNodes.find((n) => n.data.name?.endsWith(".rb"));
  //     node ? node.activate() : tree?.firstNode?.activate();
  //   }
  // }, [tree]);

  useEffect(() => {
    if (currentFile === null) return;

    setCode(decode(currentFile.data));
  }, [currentFile]);

  // useEffect(() => {
  //   if (editorInitializing && treeData) {
  //     activateFirstFile();
  //   } else if (!bundleInstalled.current) {
  //     ((getQueryParam("gem") || getQueryParam("gist")) && !getQueryParam("embed")) && canRunBundleInstall && bundleInstall();
  //     bundleInstalled.current = true;
  //   }
  // }, [treeData, activateFirstFile, bundleInstall, canRunBundleInstall, editorInitializing]);

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");

    if (currentFilePath) {
      webcontainerInstance.fs.writeFile(currentFilePath, value || "");
    }
  };

  const theme = useEditorTheme();

  return (
    <div className={cs.editorContainer}>
      <div className={cs.editorHeader}>
        {currentFilePath && <label className={cs.editorLabel}>{currentFilePath}</label>}
      </div>
      <div className={cs.editorText}>
        {
          currentFilePath && currentFile ? (
            <MonacoEditor
              height="100%"
              width="100%"
              theme={theme}
              defaultLanguage="ruby"
              path={currentFilePath}
              defaultValue={decode(currentFile.data)}
              onChange={handleEditorChange}
              onMount={() => {
                setInitializing(false);
              }}
              options={{
                fontFamily: "Martian Mono, monospace",
                automaticLayout: true,
                wordWrap: "on",

                glyphMargin: false,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 3,
                minimap: { enabled: false },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true
              }}
            />

          ) : (
            !editorInitializing && (
              <div className={cs.editorPlaceholder}>
                Select a file to edit
              </div>
            )
          )
        }
      </div>
    </div>
  );
};
