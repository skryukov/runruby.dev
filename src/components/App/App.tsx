import { useEffect } from "react";

import { Content } from "../Content/Content.tsx";
import { Header } from "../Header/Header.tsx";

import cs from "./App.module.css";

export default function App() {
  useEffect(() => {
    const onPopState = () => location.reload();

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return (
    <div className={cs.container}>
      <Header />
      <Content />
    </div>
  );
}
