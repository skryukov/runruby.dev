import cs from "./styles.module.css";
import { Editor } from "../Editor/Editor.tsx";


export default function App() {
  return (
    <div className={cs.container}>
      <div className={cs.header}>
        <h1 className={cs.title}>Ruby WASI Playground</h1>
      </div>
      <Editor />
    </div>
  );
}
