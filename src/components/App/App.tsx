import { useState } from "react";
import Editor from "@monaco-editor/react";

import { runWASI } from "../../engines/wasi";
import cs from "./styles.module.css";

const initialRubyCode = `require "uri-idna"

URI::IDNA.register(alabel: "xn--gdkl8fhk5egc.jp", ulabel: "ハロー・ワールド.jp")
`;

export default function App() {
  const [gem, setGem] = useState("");
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(initialRubyCode);
  const [result, setResult] = useState("Press run...");
  const [log, setLog] = useState<string[]>([]);
  const [editorValueSource, setEditorValueSource] = useState<"result" | "logs">("result");
  const [installedGems, setInstalledGems] = useState<string[]>([]);

  const runVM = (executeCode?: string, onSuccess?: Function, onError?: Function ) => {
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
    runWASI({ code: (executeCode || code), setResult, setStdout, setStderr })
      .catch((err) => {
        setLog((old) => [...old, `[error] ${err}`]);
        setEditorValueSource("logs");
        onError && onError(err);
      })
      .then(() => {
        setEditorValueSource("result");
        onSuccess && onSuccess();
      })
      .finally(() => setLoading(false));
  };

  const installGem = () => {
    if (!gem) {
      return;
    }
    runVM(
      `Gem::Commands::InstallCommand.new.install_gem("${gem}", nil)`,
      () => setInstalledGems((old) => [...old, gem]),
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
          {installedGems.map((gem) => (
            <div className={cs.menuDependency} key={gem}>
              {gem}
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
            options={{ wordWrap: "on", minimap: { enabled: false }, overviewRulerBorder: false }}
          />
        </div>
        <div className={cs.editorFooter}>
          <div className={cs.editorLoading}>
            {loading && "loading..."}
          </div>
          <button className={cs.runButton} disabled={loading} onClick={() => !loading && runVM()}>
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
            options={{wordWrap: "on", lineNumbers: "off", readOnly: true, minimap: { enabled: false }, overviewRulerBorder: false, renderLineHighlight: "none" }}
          />
        </div>
      </div>
    </div>
  );
}
