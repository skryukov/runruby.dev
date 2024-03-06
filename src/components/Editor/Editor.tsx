import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import { useStore } from "@nanostores/react";
import { VscLoading } from "react-icons/vsc";

import { decode, writeFile } from "../../engines/wasi/editorFS.ts";
import { RunVMParams } from "../../useVM.ts";
import { db } from "../../db.ts";
import { bundleDir, gemsDir } from "../../engines/wasi/wasi.ts";
import { refreshCacheInfo } from "../../stores/cache.ts";
import { openTab } from "../../stores/output.ts";
import {
  $editor,
  currentFilePathStore,
  currentFileStore,
  refreshTreeData,
  setCode
} from "../../stores/editor.ts";
import { useEditorTheme } from "../../useEditorTheme.ts";
import { getQueryParam } from "../../fsInitializer.ts";

import cs from "./Editor.module.css";

type EditorProps = {
  loading: boolean;
  runVM: (RunVMParams: RunVMParams) => void;
}
export const Editor = ({
                         loading: VMRunning,
                         runVM
                       }: EditorProps) => {
  const [editorInitializing, setInitializing] = useState(true);
  const bundleInstalled = useRef(false);

  const loading = VMRunning || editorInitializing;

  const { treeData, tree, code } = useStore($editor);
  const currentFilePath = useStore(currentFilePathStore);
  const currentFile = useStore(currentFileStore);

  const canRunBundleInstall = useMemo(() => (
    !loading && treeData.find((entry) => entry.name === "Gemfile")
  ), [loading, treeData]);

  const canRunCode = useMemo(() => (
    !loading && currentFilePath?.endsWith(".rb")
  ), [currentFilePath, loading]);

  const runCode = useCallback(() => {
    if (!currentFilePath?.endsWith(".rb")) return;

    runVM({
      code: `
      ${canRunBundleInstall ? `require "rubygems_stub"
        require "bundler_stub"
        require "bundler/setup"` : ""}
      eval(<<~'CODE', binding, '${currentFilePath}', 1)
       ${code}
      CODE
    `,
      onBefore: () => {
        openTab("logs");
      },
      onSuccess: () => {
        openTab("logs");
      }, onError: () => {
        openTab("logs");
      }
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
    rescue StandardError => e
      $stderr << e.message << "\\n" << e.backtrace.join("\\n")
    end
    `,
        onBefore: () => {
          openTab("logs");
        },
        onSuccess: () => {
          openTab("logs");
          db.fsCache.clear().then(async () => {
            await db.fsCache.add({
              key: "gemsDir",
              data: gemsDir.dir.contents as never
            });
            await db.fsCache.add({
              key: "bundleDir",
              data: bundleDir.dir.contents as never
            });
            refreshCacheInfo();
          });
        }, onError: () => {
          openTab("logs");
        },
        onFinally: refreshTreeData
      }
    );
  }, [runVM]);

  const activateFirstFile = useCallback(() => {
    if (tree) {
      const node = tree.visibleNodes.find((n) => n.data.name?.endsWith(".rb"));
      node ? node.activate() : tree?.firstNode?.activate();
    }
  }, [tree]);

  useEffect(() => {
    if (currentFile === null) return;

    setCode(decode(currentFile.data));
  }, [currentFile]);

  useEffect(() => {
    if (editorInitializing && treeData) {
      activateFirstFile();
    } else if (!bundleInstalled.current) {
      ((getQueryParam("gem") || getQueryParam("gist")) && !getQueryParam("embed")) && canRunBundleInstall && bundleInstall();
      bundleInstalled.current = true;
    }
  }, [treeData, activateFirstFile, bundleInstall, canRunBundleInstall, editorInitializing]);

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");

    if (currentFilePath) {
      writeFile(currentFilePath, value || "")
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
      <div className={cs.editorFooter}>
        <div className={cs.editorLoading}>
          {loading && <VscLoading size={20} />}
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
    </div>
  );
};
