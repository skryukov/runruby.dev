import { useState } from "react";
import Editor from "@monaco-editor/react";

import { runWASI } from "../../engines/wasi";
import cs from "./styles.module.css";
import { RbValue } from "@ruby/wasm-wasi";
import SvgSpinner from "./spinner.svg?react";

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
    // setTimeout is needed to allow the loading status to render
    setTimeout(() =>
      runWASI({ code: (executeCode || code), setResult, setStdout, setStderr })
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
    ,20);
  };

  const installGem = () => {
    if (!gem) {
      return;
    }
    setInstalledGems((old) => ({ ...old, [gem]: null }));
    runVM(
      `a = Gem::Commands::InstallCommand.new; a.install_gem("${gem}", nil); a.installed_specs.map { [_1.name, _1.version.to_s] }.to_h`,
      (result) => {
        const version = result.toJS()[gem];
        setInstalledGems((old) => ({ ...old, [gem]: version }));
      },
      () => setInstalledGems((old) => {
        const { [gem]: _, ...rest } = old;
        return rest;
      })
    );
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
