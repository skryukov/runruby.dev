import MonacoEditor from "@monaco-editor/react";
import stripAnsi from "strip-ansi";
import { useStore } from "@nanostores/react";
import { useMemo } from "react";

import cs from "./Output.module.css";
import { $output, openTab } from "../../stores/output.ts";
import { CacheTab } from "./CacheTab.tsx";
import { InfoTab } from "./InfoTab.tsx";
import { useMediaQuery } from "react-responsive";

export const Output = ({ result, log }: {
  result: string,
  log: string[],
}) => {
  const outputStore = useStore($output);
  const { activeTab } = outputStore;

  const value = useMemo(() => {
    let v = "";
    v += stripAnsi(log.join("\n"));
    if (result) {
      if (v) v += "\n\n";
      v += ">> " + result;
    }
    return v;
  }, [log, result]);

  const darkTheme = useMediaQuery({
    query: "(prefers-color-scheme: dark)"
  });

  return (
    <>
      <div className={cs.switchButtons}>
        <button className={`${cs.switchButton} ${activeTab === "logs" ? cs.switchButtonActive : ""}`}
                onClick={() => openTab("logs")}>
          Logs
        </button>
        <button className={`${cs.switchButton} ${activeTab === "info" ? cs.switchButtonActive : ""}`}
                onClick={() => openTab("info")}>
          About
        </button>
        <button className={`${cs.switchButton} ${activeTab === "gems" ? cs.switchButtonActive : ""}`}
                onClick={() => openTab("gems")}>
          Cached Gems
        </button>
      </div>
      <div className={cs.editorText}>
        {
          (activeTab === "logs") ? (
            <MonacoEditor
              height="100%"
              width="100%"
              theme={darkTheme ? "vs-dark" : "light"}
              value={value}
              language="shell"
              options={{
                wordWrap: "on",
                lineNumbers: "off",
                readOnly: true,
                minimap: { enabled: false },
                overviewRulerBorder: false,
                renderLineHighlight: "none",
                hideCursorInOverviewRuler: true
              }} />
          ) : (activeTab === "info") ? (
            <div className={cs.tab}>
              <InfoTab />
            </div>) : (
            <div className={cs.tab}>
              <CacheTab />
            </div>
          )
        }
      </div>
    </>
  )
    ;
};
