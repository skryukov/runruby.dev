import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

import { runWASI } from "../../engines/wasi";
import cs from "./styles.module.css";
import { RbValue } from "@ruby/wasm-wasi";
import { File, Directory } from "@bjorn3/browser_wasi_shim";
import { decode, encode, workDir } from "../../engines/wasi/editorFS.ts";

export default function App() {
  const [loading, setLoading] = useState(true);
  // TODO: get first file from workDir
  const [code, setCode] = useState(decode((workDir.dir.contents["main.rb"] as File).data));
  const [result, setResult] = useState("Press run...");
  const [log, setLog] = useState<string[]>([]);
  const [editorValueSource, setEditorValueSource] = useState<"result" | "logs">("result");
  // object of gems and their versions as values
  const [currentFile, setCurrentFile] = useState<File>(workDir.dir.contents["main.rb"] as File);

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
          .finally(() => setLoading(false))
      , 20);
  };

  const runCode = () => {
    runVM(`require "bundler/setup";${code}`)
  };
  const bundleInstall = () => {
    runVM(`require "bundler/cli";require "bundler/cli/install";Bundler::CLI::Install.new({path: './gems'}).run`,
      () => {
        setResult("Bundle install successful (see logs for details)")
      },
      () => {
        setResult("Bundle install failed (see logs for details)")
      }
    );
  }

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");
  };

  useEffect(() => {
    currentFile.data = encode(code);
  }, [code])

  return (
    <div className={cs.container}>
      <div className={cs.header}>
        <h1 className={cs.title}>Ruby WASI Playground</h1>
      </div>
      <div className={cs.menu}>
        <label className={cs.menuLabel}>
          Files
        </label>

        <div className={cs.menuFiles}>
          {Object.keys(workDir.dir.contents).map((file) => (
            <div className={`${cs.menuFile} ${currentFile === workDir.dir.contents[file] ? cs.menuFileActive : ''}`} key={file} onClick={() => {
              const fileOrDir = workDir.dir.contents[file];
              if (fileOrDir instanceof Directory) {
                //
              } else if (fileOrDir instanceof File) {
                setCurrentFile(fileOrDir);
                setCode(decode(fileOrDir.data));
              }
            }}>
              {file}
            </div>
          ))}
        </div>
      </div>

      <div className={cs.editor}>
        <div className={cs.editorText}>
          <Editor
            height="100%"
            width="100%"
            theme="vs-dark"
            defaultLanguage="ruby"
            value={code}
            onChange={handleEditorChange}
            onMount={() => setLoading(false)}
            options={{
              wordWrap: "on",
              minimap: { enabled: false },
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true
            }}
          />
        </div>
        <div className={cs.editorFooter}>
          <div className={cs.editorLoading}>
            {loading && "loading..."}
          </div>
          <button className={`${cs.installButton} ${loading ? cs.buttonDisabled : ""}`} disabled={loading}
                  onClick={() => !loading && bundleInstall()}>
            Bundle install
          </button>
          <button className={`${cs.runButton} ${loading ? cs.buttonDisabled : ""}`} disabled={loading}
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
          <Editor
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
    </div>
  );
}
