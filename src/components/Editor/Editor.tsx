import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Directory, File } from "@bjorn3/browser_wasi_shim";
import MonacoEditor from "@monaco-editor/react";
import { useStore } from "@nanostores/react";

import {
  decode, embedFromURI,
  encode,
  gemFromURI,
  gistFromURI,
  workDir
} from "../../engines/wasi/editorFS.ts";
import importFromGist from "../../gist.ts";
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

import cs from "./Editor.module.css";
import { VscLoading } from "react-icons/vsc";

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

        refreshTreeData();
        setTimeout(() => activateFirstFile(), 20);
      });
    }
  }, [activateFirstFile]);

  useEffect(() => {
    if (editorInitializing) {
      activateFirstFile();
    } else if (!bundleInstalled.current) {
      ((gemFromURI() || gistFromURI()) && !embedFromURI()) && canRunBundleInstall && bundleInstall();
      bundleInstalled.current = true;
    }
  }, [activateFirstFile, bundleInstall, canRunBundleInstall, editorInitializing]);

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");

    if (currentFile) {
      currentFile.data = encode(value || "");
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
