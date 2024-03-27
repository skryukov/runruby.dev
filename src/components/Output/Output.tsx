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
      <div className={`${cs.tab} ${activeTab === 'terminal' ? cs.activeTab : ''}`}>
        <Terminal />
      </div>
      <div className={`${cs.tab} ${activeTab === "info" ? cs.activeTab : ""}`}>
        <InfoTab />
      </div>
      <div className={`${cs.tab} ${activeTab === 'settings' ? cs.activeTab : ''}`}>
        <SettingsTab />
      </div>
    </>
  );
};
