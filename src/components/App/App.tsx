import { Content } from "../Content/Content.tsx";

import cs from "./App.module.css";

export default function App() {
  return (
    <div className={cs.container}>
      <div className={cs.header}>
        <h1 className={cs.title}>RunRuby.dev</h1>
      </div>
      <Content />
    </div>
  );
}
