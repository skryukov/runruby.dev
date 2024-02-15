import { Content } from "../Content/Content.tsx";
import { Header } from "../Header/Header.tsx";

import cs from "./App.module.css";

export default function App() {
  return (
    <div className={cs.container}>
      <Header />
      <Content />
    </div>
  );
}
