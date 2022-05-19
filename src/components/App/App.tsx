import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { RubyVM } from "ruby-head-wasm-wasi";

import { createRuby } from "../../utils/wasm";
import { installGem } from "../../utils/installGem";

export default function App() {
  const [rubyVM, setRubyVM] = useState<RubyVM | undefined>(undefined)
  useEffect(() => {
    const load = async () =>{
      const vm = await createRuby();
      await installGem(vm, "dry-initializer", "3.1.1")
      setRubyVM(vm);
    }

    load().catch(console.error);
  }, [installGem, createRuby]);

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
        <button onClick={() => rubyVM && setResult(rubyVM.eval(state).toString())}>
          Run
        </button>
        <h5>Result:</h5>
        {result}
      </div>
    </div>
  );
}
