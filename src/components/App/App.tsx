import { useState } from "react";
import Editor from "@monaco-editor/react";

import { rubyVM } from "../../utils/wasm";
import { installGem } from "../../utils/installGem";

await installGem("dry-initializer", "3.1.1");

export default function App() {
  const [state, setState] = useState("require 'dry-initializer'");
  const [result, setResult] = useState("Press run...");

  const handleEditorChange = (value: string | undefined) => {
    setState(value || "");
  };

  return (
    <div style={{ display: "flex", padding: "10px" }}>
      <Editor
        height="90vh"
        width="50%"
        defaultLanguage="ruby"
        defaultValue={state}
        onChange={handleEditorChange}
      />
      <div style={{ width: "50%", paddingLeft: "10px" }}>
        <button onClick={() => setResult(rubyVM.eval(state).toString())}>
          Run
        </button>
        <h5>Result:</h5>
        {result}
      </div>
    </div>
  );
}
