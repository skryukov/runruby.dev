import cs from "../App/styles.module.css";
import MonacoEditor from "@monaco-editor/react";
import { decode, encode, workDir } from "../../engines/wasi/editorFS.ts";
import { useEffect, useMemo, useRef, useState } from "react";
import { Directory, File, SyncOPFSFile } from "@bjorn3/browser_wasi_shim";
import { RbValue } from "@ruby/wasm-wasi";
import { runWASI } from "../../engines/wasi";

import Node from "../FileTree/Node";

export type Entity = {
  id: string;
  name: string;
  object: Directory | File | SyncOPFSFile;
}

import { CreateHandler, DeleteHandler, RenameHandler, Tree, TreeApi } from "react-arborist";
import { NodeApi } from "react-arborist/dist/module/interfaces/node-api";
import { VscNewFile, VscNewFolder } from "react-icons/vsc";
import { nanoid } from "nanoid";

function sortChildren(node: Directory): Entity[] {
  const entries = Object.entries(node.contents).map((entry) => {
    const id = idsMap.get(entry[1]) || nanoid();
    idsMap.set(entry[1], id);
    return { id, name: entry[0], object: entry[1] }
  });
  entries.sort((a, b) => {
    if (a.object instanceof Directory && b.object instanceof File) return -1;
    if (b.object instanceof Directory && a.object instanceof File) return 1;
    return a.name < b.name ? -1 : 1;
  });
  return entries;
}

const idsMap = new Map<File|Directory|SyncOPFSFile, string>

function getPath(node: NodeApi<Entity>) {
  let path = node.data.name;
  let parent = node.parent;
  while (parent && !parent.isRoot) {
    path = `${parent.data.name}/${path}`;
    parent = parent.parent;
  }
  return path;
}

export const Editor = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState("Press run...");
  const [log, setLog] = useState<string[]>([]);
  const [editorValueSource, setEditorValueSource] = useState<"result" | "logs">("result");

  const [currentFilePath, setCurrentFilePath] = useState<string | null>("main.rb");

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

  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (currentFile === null) return;

    setCode(decode(currentFile.data));
  }, [currentFilePath]);

  useEffect(() => {
    if (currentFile === null || code === null) return;

    currentFile.data = encode(code);
  }, [code]);

  const runVM = (code: string, onSuccess?: (result: RbValue) => void, onError?: Function) => {
    setLoading(true);
    setLog([]);
    setResult("");
    setEditorValueSource("logs");
    const setStdout = (line: string) => {
      console.log(line);
      setLog((old) => [...old, line]);
    };
    const setStderr = (line: string) => {
      console.warn(line);
      setLog((old) => [...old, `[error] ${line}`]);
    };
    // setTimeout is needed to allow the loading status to render
    setTimeout(() =>
        runWASI({ code, setResult, setStdout, setStderr })
          .then((result) => {
            setEditorValueSource("result");
            onSuccess && onSuccess(result);
          })
          .catch((err) => {
            setLog((old) => [...old, `[error] ${err}`]);
            setEditorValueSource("logs");
            onError && onError(err);
          })
          .finally(() => {
            setLoading(false)
            setTreeData(sortChildren(workDir.dir));
          })
      , 20);
  };

  const runCode = () => {
    if (!currentFilePath?.endsWith('.rb')) return;
    if (currentFile === null) return;

    runVM(`require "bundler/setup";${decode(currentFile.data)}`);
  };
  const bundleInstall = () => {
    runVM(`require "bundler/cli";require "bundler/cli/install";Bundler::CLI::Install.new({path: './gems'}).run`,
      () => {
        setResult("Bundle install successful (see logs for details)");
      },
      () => {
        setResult("Bundle install failed (see logs for details)");
      }
    );
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");
  };
  const treeRef = useRef<TreeApi<Entity>>(null);

  const [treeData, setTreeData] = useState(sortChildren(workDir.dir));

  const onRename: RenameHandler<Entity> = ({ name, node }) => {
    const parent = (node.parent == null || node.parent.isRoot) ? workDir.dir : node.parent.data.object as Directory;

    if (node && node.data.name !== name) {
      if (parent.contents[name] !== undefined) {
        throw new Error(`File or directory with name ${name} already exists`);
      }
      parent.contents[name] = node.data.object;
      delete parent.contents[node.data.name];
      node.data = {...node.data, name};
      setTreeData(sortChildren(workDir.dir));
    }
  };

  const onCreate: CreateHandler<Entity> = ({ parentNode, type }) => {
    const parent = (parentNode?.data?.object || workDir.dir) as Directory;
    const object = (type === "leaf") ? new File(encode("")) : new Directory({});
    const name = (type === "leaf") ? `new_file_${Date.now()}.rb` : `new_dir_${Date.now()}`;
    parent.contents[name] = object;
    const id = nanoid();
    idsMap.set(object, id);
    setTreeData(sortChildren(workDir.dir));
    return { id, name, object };
  };

  const onDelete: DeleteHandler<Entity> = ({ ids }) => {
    ids.forEach((id) => {
      const node = treeRef.current?.get(id);
      if (node) {
        const parent = (node.parent == null || node.parent.isRoot) ? workDir.dir : node.parent.data.object as Directory;
        delete parent.contents[node.data.name];
        if (currentFilePath === getPath(node)) {
          setCurrentFilePath(null);
        }
      }
    });
    setTreeData(sortChildren(workDir.dir));
  };

  const canRunCode = useMemo(() => !loading && currentFilePath?.endsWith('.rb'), [currentFilePath, loading]);
  const canRunBundleInstall = useMemo(() => !loading && treeData.find((entry) => entry.name === 'Gemfile'), [loading, treeData]);

  return (
    <>
      <div className={cs.menu}>

        <div className={cs.menuHead}>
          <label className={cs.menuLabel}>Files</label>
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
          childrenAccessor={({object}) => (object instanceof Directory) ? sortChildren(object) : null}
          ref={treeRef}
          disableDrag={true}
          disableDrop={true}
          onRename={onRename}
          onCreate={onCreate}
          onDelete={onDelete}
          onActivate={(node: NodeApi) => {
            if (node.isLeaf) {
              setCurrentFilePath(getPath(node));
            }
          }}
        >
          {Node}
        </Tree>
      </div>

      <div className={cs.editor}>
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
                onMount={() => setLoading(false)}
                options={{
                  wordWrap: "on",
                  minimap: { enabled: false },
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true
                }}
              />

            ) : (
              <div className={cs.editorPlaceholder}>
                Select a file to edit
              </div>
            )
          }
        </div>
        <div className={cs.editorFooter}>
          <div className={cs.editorLoading}>
            {loading && "loading..."}
          </div>
          <button className={`${cs.installButton} ${canRunBundleInstall ? "" : cs.buttonDisabled}`} disabled={!canRunBundleInstall}
                  onClick={() => !loading && bundleInstall()}>
            Bundle install
          </button>
          <button className={`${cs.runButton} ${canRunCode ? "" : cs.buttonDisabled}`} disabled={!canRunCode}
                  onClick={() => !loading && runCode()}>
            Run code
          </button>
        </div>
      </div>

      <div className={cs.output}>
        <div className={cs.switchButtons}>
          <button className={`${cs.switchButton} ${editorValueSource === "result" ? cs.switchButtonActive : ""}`}
                  onClick={() => setEditorValueSource("result")}>
            Result
          </button>
          <button className={`${cs.switchButton} ${editorValueSource === "logs" ? cs.switchButtonActive : ""}`}
                  onClick={() => setEditorValueSource("logs")}>
            Logs
          </button>
        </div>
        <div className={cs.editorText}>
          <MonacoEditor
            height="100%"
            width="100%"
            theme="vs-dark"
            value={editorValueSource === "result" ? result : log.join("\n")}
            language="shell"
            options={{
              wordWrap: "on",
              lineNumbers: "off",
              readOnly: true,
              minimap: { enabled: false },
              overviewRulerBorder: false,
              renderLineHighlight: "none",
              hideCursorInOverviewRuler: true
            }}
          />
        </div>
      </div>
    </>
  );
};
