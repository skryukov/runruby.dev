import MonacoEditor from "@monaco-editor/react";

import cs from "./Output.module.css";

export type OutputTab = "result" | "logs";

export const Output = ({ result, log, outputTab, setOutputTab }: {
  result: string,
  log: string[],
  outputTab: OutputTab,
  setOutputTab: (v: OutputTab) => void
}) => {
  return (
    <>
      <div className={cs.switchButtons}>
        <button className={`${cs.switchButton} ${outputTab === "result" ? cs.switchButtonActive : ""}`}
                onClick={() => setOutputTab("result")}>
          Result
        </button>
        <button className={`${cs.switchButton} ${outputTab === "logs" ? cs.switchButtonActive : ""}`}
                onClick={() => setOutputTab("logs")}>
          Logs
        </button>
      </div>
      <div className={cs.editorText}>
        <MonacoEditor
          height="100%"
          width="100%"
          theme="vs-dark"
          value={outputTab === "result" ? result : log.join("\n")}
          language="shell"
          options={{
            wordWrap: "on",
            lineNumbers: "off",
            readOnly: true,
            minimap: { enabled: false },
            overviewRulerBorder: false,
            renderLineHighlight: "none",
            hideCursorInOverviewRuler: true
          }}
        />
      </div>
    </>
  );
};
