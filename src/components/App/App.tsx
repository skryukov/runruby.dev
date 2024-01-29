import { useState } from "react";
import Editor from "@monaco-editor/react";

import cs from "./styles.module.css";
import { RbValue } from "@ruby/wasm-wasi";
import SvgSpinner from "./spinner.svg?react";
import VMWorker from '../../worker?worker'

const vmWorker = new VMWorker();

const initialRubyCode = `# This is a Ruby WASI playground
# You can run any Ruby code here and see the result
# You can also install gems and use them in your code (unless they use native extensions)
# For example, try installing the URI::IDNA gem and using it in your code:  
require "uri-idna"

URI::IDNA.register(alabel: "xn--gdkl8fhk5egc.jp", ulabel: "ハロー・ワールド.jp")
`;

export default function App() {
  const [gem, setGem] = useState("");
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(initialRubyCode);
  const [result, setResult] = useState("Press run...");
  const [log, setLog] = useState<string[]>([]);
  const [editorValueSource, setEditorValueSource] = useState<"result" | "logs">("result");
  // object of gems and their versions as values
  const [installedGems, setInstalledGems] = useState<{ [key: string]: string|null }>({});

  const runVM = (executeCode?: string, onSuccess?: (result: RbValue) => void, onError?: Function) => {
    setLoading(true);
    setLog([]);
    setResult("");
    const setStdout = (line: string) => {
      console.log(line);
      setLog((old) => [...old, line]);
    };
    const setStderr = (line: string) => {
      console.warn(line);
      setLog((old) => [...old, `[error] ${line}`]);
    };

    vmWorker.postMessage({type: 'runCode', code: (executeCode || code)});
    console.log('code:')
    vmWorker.onmessage = (event) => {
      const {type, data} = event.data;
      if (type === 'stdout') {
        setStdout(data);
      } else if (type === 'stderr') {
        setStderr(data);
      } else if (type === 'result') {
        setResult(data);
        setEditorValueSource("result");
        onSuccess && onSuccess(data);
        setLoading(false)
      } else if (type === 'error') {
        setLog((old) => [...old, `[error] ${data}`]);
        setEditorValueSource("logs");
        onError && onError(data);
        setLoading(false)
      }
    }
  };

  const installGem = () => {
    if (!gem) {
      return;
    }
    const setStdout = (line: string) => {
      console.log(line);
      setLog((old) => [...old, line]);
    };
    const setStderr = (line: string) => {
      console.warn(line);
      setLog((old) => [...old, `[error] ${line}`]);
    };
    setInstalledGems((old) => ({ ...old, [gem]: null }));
    vmWorker.postMessage({type: 'installGem', gem});
    vmWorker.onmessage = (event) => {
      console.log('event:', event)
      const {type, data} = event.data;
      if (type === 'stdout') {
        setStdout(data);
      } else if (type === 'stderr') {
        setStderr(data);
      } else if (type === 'installed') {
        setInstalledGems((old) => ({ ...old, [gem]: data.version }));
      } else if (type === 'error') {
        setInstalledGems((old) => {
          const { [gem]: _, ...rest } = old;
          return rest;
        });
        setLoading(false)
      }
    }
    setGem("");
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");
  };

  return (
    <div className={cs.container}>
      <div className={cs.header}>
        <h1 className={cs.title}>Ruby WASI Playground</h1>
      </div>
      <div className={cs.menu}>
        <label className={cs.menuLabel}>
          Dependencies
        </label>
        <div className={cs.menuInputButton}>
          <input
            className={cs.menuInput}
            onKeyDown={(event) => event.key === "Enter" && !loading && installGem()}
            value={gem}
            placeholder="Enter gem to install"
            disabled={loading}
            onChange={(event) => setGem(event.target.value)}
          />
          <button className={cs.menuInstallButton} disabled={loading} onClick={() => !loading && installGem()}>
            +
          </button>
        </div>
        <div className={cs.menuDependencies}>
          {Object.keys(installedGems).map((gem) => (
            <div className={cs.menuDependency} key={gem}>
              {gem} {installedGems[gem] ? `(${installedGems[gem]})` : (
              <SvgSpinner className={cs.menuSpinner}/>
            )}
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
            defaultValue={code}
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
          <button className={`${cs.runButton} ${loading ? cs.runButtonDisabled : ''}`} disabled={loading} onClick={() => !loading && runVM()}>
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
