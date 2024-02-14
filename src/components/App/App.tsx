import { Content } from "../Content/Content.tsx";

import cs from "./App.module.css";
import { VscClose, VscMenu } from "react-icons/vsc";
import { $menu, toggleMenu } from "../../stores/menu.ts";
import { useStore } from "@nanostores/react";

export default function App() {
  const { isOpen } = useStore($menu);

  return (
    <div className={cs.container}>
      <header className={cs.header}>
        <button className={cs.menuButton} onClick={toggleMenu}>
          {isOpen ? <VscClose size={16} /> : <VscMenu size={16} />}
        </button>

        <h1 className={cs.title}>RunRuby.dev</h1>
      </header>
      <Content />
    </div>
  );
}
