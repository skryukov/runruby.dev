import { action, map, onMount } from "nanostores";

type CacheStoreValue = {
  info: { message?: string; usage?: number; quota?: number };
};
export const $cache = map<CacheStoreValue>({
  info: { message: "Loading..." },
});

export const refreshCacheInfo = action($cache, "increase", (store) => {
  store.setKey("info", { message: "Loading..." });

  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then((estimation) => {
      store.setKey("info", {
        usage: estimation.usage,
        quota: estimation.quota,
      });
    });
  } else {
    store.setKey("info", { message: "StorageManager not found" });
  }
});

onMount($cache, () => {
  refreshCacheInfo();
});
