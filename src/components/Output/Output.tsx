import { useStore } from "@nanostores/react";

import { $output, openTab } from "../../stores/output.ts";

import { SettingsTab } from "./SettingsTab.tsx";
import { InfoTab } from "./InfoTab.tsx";
import { Terminal } from "./Terminal.tsx";
import cs from "./Output.module.css";

export const Output = () => {
  const outputStore = useStore($output);
  const { activeTab } = outputStore;

  return (
    <>
      <div className={cs.switchButtons}>
        <button className={`${cs.switchButton} ${activeTab === "terminal" ? cs.switchButtonActive : ""}`}
                onClick={() => openTab("terminal")}>
          Terminal
        </button>
        <button className={`${cs.switchButton} ${activeTab === "info" ? cs.switchButtonActive : ""}`}
                onClick={() => openTab("info")}>
          About
        </button>
        <button className={`${cs.switchButton} ${activeTab === "settings" ? cs.switchButtonActive : ""}`}
                onClick={() => openTab("settings")}>
          Settings
        </button>
      </div>
      <div className={cs.editorText}>
        {
          (activeTab === "terminal") ? (
            <Terminal />
          ) : (activeTab === "info") ? (
            <InfoTab />
          ) : (
            <SettingsTab />
          )
        }
      </div>
    </>
  )
    ;
};
