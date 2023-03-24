import { useState } from "react";
import Editor from "@monaco-editor/react";

import { runWASI } from "../../engines/wasi";

const initialRubyCode = `require "uri/idna"

URI::IDNA.register(alabel: "xn--gdkl8fhk5egc.jp", ulabel: "ハロー・ワールド.jp")
`;

export default function App() {
  const [gem, setGem] = useState("uri-idna");
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(initialRubyCode);
  const [result, setResult] = useState("Press run...");
  const [stdLog, setStdLog] = useState<string[]>([]);
  const [errLog, setErrLog] = useState<string[]>([]);

  const runVM = (executeCode?: string) => {
    setLoading(true);
    setStdLog([]);
    setErrLog([]);
    setResult("");
    const setStdout = (line: string) => {
      console.log(line);
      setStdLog((old) => [...old, line]);
    };
    const setStderr = (line: string) => {
      console.warn(line);
      setErrLog((old) => [...old, line]);
    };
    runWASI({code: (executeCode || code), setResult, setStdout, setStderr })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const installGem = () => {
    runVM(`Gem::Commands::InstallCommand.new.install_gem("${gem}", nil)`)
  }

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || "");
  };

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
        <input
          value={gem}
          disabled={loading}
          onChange={(event) => setGem(event.target.value)}
        />
        <button disabled={loading} onClick={() => !loading && installGem()}>
          Install gem
        </button>{" "}

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
