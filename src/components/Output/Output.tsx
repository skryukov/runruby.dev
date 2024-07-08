import MonacoEditor from "@monaco-editor/react";
import stripAnsi from "strip-ansi";
import { useStore } from "@nanostores/react";
import { useMemo } from "react";

import { useEditorTheme } from "../../useEditorTheme.ts";
import { $output, openTab } from "../../stores/output.ts";

import { SettingsTab } from "./SettingsTab.tsx";
import { InfoTab } from "./InfoTab.tsx";
import cs from "./Output.module.css";

export const Output = ({ result, log }: { result: string; log: string[] }) => {
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
  const theme = useEditorTheme();

  return (
    <>
      <div className={cs.switchButtons}>
        <button
          className={`${cs.switchButton} ${activeTab === "logs" ? cs.switchButtonActive : ""}`}
          onClick={() => openTab("logs")}
        >
          Logs
        </button>
        <button
          className={`${cs.switchButton} ${activeTab === "info" ? cs.switchButtonActive : ""}`}
          onClick={() => openTab("info")}
        >
          About
        </button>
        <button
          className={`${cs.switchButton} ${activeTab === "settings" ? cs.switchButtonActive : ""}`}
          onClick={() => openTab("settings")}
        >
          Settings
        </button>
      </div>
      <div className={cs.editorText}>
        {activeTab === "logs" ? (
          <MonacoEditor
            height="100%"
            width="100%"
            theme={theme}
            value={value}
            language="shell"
            options={{
              readOnly: true,

              fontFamily: "Martian Mono, monospace",
              automaticLayout: true,
              wordWrap: "on",

              lineNumbers: "off",
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              minimap: { enabled: false },
              overviewRulerBorder: false,
              renderLineHighlight: "none",
              hideCursorInOverviewRuler: true,
            }}
          />
        ) : activeTab === "info" ? (
          <InfoTab />
        ) : (
          <SettingsTab />
        )}
      </div>
    </>
  );
};
