import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { RubyVM } from "ruby-head-wasm-wasi";

import { createRuby } from "../../utils/wasm";
import { installGem } from "../../utils/installGem";

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
  const [rubyVM, setRubyVM] = useState<RubyVM | undefined>(undefined);
  useEffect(() => {
    const load = async () => {
      const vm = await createRuby();
      await installGem(vm, "dry-initializer", "3.1.1");
      setRubyVM(vm);
    };

    load().catch(console.error);
  }, [installGem, createRuby]);

  const [state, setState] = useState(initialRubyCode);
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
        <button
          disabled={!rubyVM}
          onClick={() => rubyVM && setResult(rubyVM.eval(state).toString())}
        >
          Run
        </button> {!rubyVM && " Ruby VM is loading..."}
        <h5>Result:</h5>
        {result}
      </div>
    </div>
  );
}
