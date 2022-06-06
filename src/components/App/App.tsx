import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

import { runWASI } from "../../engines/wasi";
import { runEmscripten } from "../../engines/emscripten";

const initialRubyCode = `# dry-initializer is downloaded and installed dynamically
require 'dry-initializer'

class User
  extend Dry::Initializer

  param  :name,  proc(&:to_s)
  param  :role,  default: proc { 'customer' }
  option :admin, default: proc { false }
  option :phone, optional: true
end

user = User.new 'Vladimir', 'admin', admin: true

user.name
`;

export default function App() {
  const currentUrlParams = new URLSearchParams(window.location.search);
  const eng = currentUrlParams.get("engine") === "emscripten" ? "emscripten" : "wasi";
  const [engine, setEngine] = useState(eng);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(initialRubyCode);
  const [result, setResult] = useState("Press run...");
  const [stdLog, setStdLog] = useState<string[]>([]);
  const [errLog, setErrLog] = useState<string[]>([]);

  const runVM = () => {
    setLoading(true);
    setStdLog([]);
    setErrLog([]);
    setResult("");
    const run = engine === "wasi" ? runWASI : runEmscripten;
    const setStdout = (line: string) => {
      console.log(line);
      setStdLog((old) => [...old, line]);
    };
    const setStderr = (line: string) => {
      console.warn(line);
      setErrLog((old) => [...old, line]);
    };
    run({ code, setResult, setStdout, setStderr })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");
  };

  useEffect(() => {
    const url = new URL(window.location.toString());
    url.searchParams.set('engine', engine);
    window.history.pushState({}, '', url);
  }, [engine]);

  return (
    <div style={{ display: "flex", padding: "10px" }}>
      <Editor
        height="90vh"
        width="50%"
        defaultLanguage="ruby"
        defaultValue={code}
        onChange={handleEditorChange}
        onMount={() => setLoading(false)}
        options={{minimap: {enabled: false}}}
      />

      <div style={{ width: "50%", paddingLeft: "10px" }}>
        <select
          value={engine}
          disabled={loading}
          onChange={(event) => setEngine(event.target.value)}
        >
          <option value="wasi">WASI</option>
          <option value="emscripten">Emscripten</option>
        </select>
        <button disabled={loading} onClick={() => !loading && runVM()}>
          Run
        </button>{" "}
        {loading && "loading..."}
        <h5>Result:</h5>
        <code>{result}</code>
        <h5>Stdout:</h5>
        <code>{stdLog}</code>
        <h5>Stderr:</h5>
        <code>{errLog}</code>
      </div>
    </div>
  );
}
