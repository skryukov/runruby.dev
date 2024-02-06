import { Editor } from "../Editor/Editor.tsx";

import cs from "./styles.module.css";

export default function App() {
  return (
    <div className={cs.container}>
      <div className={cs.header}>
        <h1 className={cs.title}>RunRuby.dev</h1>
      </div>
      <Editor />
    </div>
  );
}
