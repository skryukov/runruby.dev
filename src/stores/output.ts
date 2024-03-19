import { map } from "nanostores";

type Tab = "info" | "terminal" | "settings";

type OutputStoreValue = {
  activeTab: Tab;
}

export const $output = map<OutputStoreValue>({
  activeTab: "info"
});

export const openTab = (newTab: Tab) => {
  $output.setKey("activeTab", newTab);
};
