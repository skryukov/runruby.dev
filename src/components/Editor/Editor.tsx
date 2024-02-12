import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Directory, File } from "@bjorn3/browser_wasi_shim";
import MonacoEditor from "@monaco-editor/react";
import { TreeApi } from "react-arborist";

import { decode, encode, gemFromURI, gistFromURI, workDir } from "../../engines/wasi/editorFS.ts";

import importFromGist from "../../gist.ts";
import { OutputTab } from "../Output/Output.tsx";
import { Entity } from "../../fsMap.ts";
import { RunVMParams } from "../../useVM.ts";
import cs from "./Editor.module.css";
import { db } from "../../db.ts";
import { bundleDir, gemsDir } from "../../engines/wasi/wasi.ts";

type EditorProps = {
  loading: boolean;
  currentFilePath: string | null;
  treeData: Entity[];
  updateTreeData: () => void;
  runVM: (RunVMParams: RunVMParams) => void;
  treeRef: RefObject<TreeApi<Entity>>;
  setOutputTab: (tab: OutputTab) => void;
}
export const Editor = ({
                         loading: VMRunning,
                         currentFilePath,
                         treeData,
                         runVM,
                         updateTreeData,
                         treeRef,
                         setOutputTab
                       }: EditorProps) => {
  const [editorInitializing, setInitializing] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const bundleInstalled = useRef(false);

  const loading = VMRunning || editorInitializing;

  const canRunBundleInstall = useMemo(() => (
    !loading && treeData.find((entry) => entry.name === "Gemfile")
  ), [loading, treeData]);

  const canRunCode = useMemo(() => (
    !loading && currentFilePath?.endsWith(".rb")
  ), [currentFilePath, loading]);

  const currentFile = useMemo(
    () => {
      if (currentFilePath === null) return null;

      const pathParts = currentFilePath.split("/");
      let currentDir = workDir.dir;
      let currentFile = currentDir.contents[pathParts[0]];
      for (let i = 1; i < pathParts.length; i++) {
        if (currentFile instanceof Directory) {
          currentDir = currentFile as Directory;
          currentFile = currentDir.contents[pathParts[i]];
        } else {
          throw new Error(`Invalid path: ${currentFilePath}`);
        }
      }
      return currentFile as File;
    },
    [currentFilePath]
  );

  const runCode = useCallback(() => {
    if (!currentFilePath?.endsWith(".rb")) return;

    runVM({
      code: `
      ${canRunBundleInstall ? "require 'bundler/setup'" : ""}
      eval(<<~'CODE', binding, '${currentFilePath}', 1)
       ${code}
      CODE
    `
    });
  }, [canRunBundleInstall, code, currentFilePath, runVM]);

  const bundleInstall = useCallback(() => {
    runVM({
        code: `require "rubygems_stub"
    require "thread_stub"
    require "bundler_stub"
    require "bundler/cli"
    require "bundler/cli/install"
    begin
      Bundler::CLI::Install.new({path: './gems'}).run
      "Bundle install successful (see logs for details)"
    rescue StandardError => e
      $stderr << e.message << "\\n" << e.backtrace.join("\\n") << "\\n"
      "Bundle install failed\n#{e.message}"
    end
    `,
        onBefore: () => {
          setOutputTab("logs");
        },
        onSuccess: () => {
          setOutputTab("result");
          db.fsCache.clear().then(() => {
            db.fsCache.add({
              key: "gemsDir",
              data: gemsDir.dir.contents
            });
            db.fsCache.add({
              key: "bundleDir",
              data: bundleDir.dir.contents
            });
          })
        }, onError: () => {
          setOutputTab("logs");
        },
        onFinally: updateTreeData
      }
    );
  }, [runVM, setOutputTab, updateTreeData]);

  const activateFirstFile = useCallback(() => {
    const tree = treeRef.current;
    if (tree) {
      const node = tree.visibleNodes.find((n) => n.data.name?.endsWith(".rb"));
      node ? node.activate() : tree?.firstNode?.activate();
    }
  }, [treeRef]);

  useEffect(() => {
    if (currentFile === null) return;

    setCode(decode(currentFile.data));
  }, [currentFile]);

  useEffect(() => {
    const gist = gistFromURI();
    if (gist) {
      importFromGist(gist).then(({ files }) => {
        files.forEach(({ filename, content }) => {
          const parts = filename.split("/");
          const name = parts.pop() as string;
          let dir = workDir.dir;
          parts.forEach((part) => {
            if (!dir.contents[part]) {
              dir.contents[part] = new Directory({});
            }
            dir = dir.contents[part] as Directory;
          });
          workDir.dir.contents[name] = new File(encode(content));
        });

        updateTreeData();
        setTimeout(() => activateFirstFile(), 20);
      });
    }
  }, [activateFirstFile, updateTreeData]);

  useEffect(() => {
    if (editorInitializing) {
      activateFirstFile();
    } else if (!bundleInstalled.current) {
      (gemFromURI() || gistFromURI()) && canRunBundleInstall && bundleInstall();
      bundleInstalled.current = true;
    }
  }, [activateFirstFile, bundleInstall, canRunBundleInstall, editorInitializing, treeRef]);

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");

    if (currentFile) {
      currentFile.data = encode(value || "");
    }
  };

  return (
    <>
      <div className={cs.editorHeader}>
        {currentFilePath && <label className={cs.editorLabel}>{currentFilePath}</label>}
      </div>
      <div className={cs.editorText}>
        {
          currentFilePath && currentFile ? (
            <MonacoEditor
              height="100%"
              width="100%"
              theme="vs-dark"
              defaultLanguage="ruby"
              path={currentFilePath}
              defaultValue={decode(currentFile.data)}
              onChange={handleEditorChange}
              onMount={() => {
                setInitializing(false);
              }}
              options={{
                wordWrap: "on",
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
      <div className={cs.editorFooter}>
        <div className={cs.editorLoading}>
          {loading && "loading..."}
        </div>
        <button className={`${cs.installButton} ${canRunBundleInstall ? "" : cs.buttonDisabled}`}
                disabled={!canRunBundleInstall}
                onClick={() => !loading && bundleInstall()}>
          Bundle install
        </button>
        <button className={`${cs.runButton} ${canRunCode ? "" : cs.buttonDisabled}`} disabled={!canRunCode}
                onClick={() => !loading && runCode()}>
          Run code
        </button>
      </div>
    </>
  );
};
