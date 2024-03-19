import { map, onMount } from "nanostores";

type CacheStoreValue = {
  info: { message?: string, usage?: number, quota?: number };
}
export const $cache = map<CacheStoreValue>({
  info: { message: "Loading..." }
});

export const refreshCacheInfo = () => {
  $cache.setKey("info", { message: "Loading..." });

  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then((estimation) => {
      $cache.setKey("info", { usage: estimation.usage, quota: estimation.quota });
    });
  } else {
    $cache.setKey("info", { message: "StorageManager not found" });
  }
};


onMount($cache, () => {
  refreshCacheInfo();
});
