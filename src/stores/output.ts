import { action, map } from "nanostores";

type Tab = "info" | "logs" | "gems" | "share";

type OutputStoreValue = {
  activeTab: Tab;
}

export const $output = map<OutputStoreValue>({
  activeTab: "info"
});

export const openTab = action($output, "openTab", (store, newTab: Tab) => {
  store.setKey("activeTab", newTab);
});
