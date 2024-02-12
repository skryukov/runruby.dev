import { useEffect, useRef } from "react";
import { db } from "./db.ts";

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export const useDBCacheInfo = () => {

  const dbSize = useRef<{ error?: string, quota?: number, usage?: number}>({ error: "Loading..."});

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimation) => {
        dbSize.current = { quota: estimation.quota, usage: estimation.usage };
      })
    } else {
      dbSize.current = { error: "StorageManager not found" };
    }
  }, [dbSize]);

  const clearCache = async () => {
    await db.fsCache.clear();
    dbSize.current = {};
  }

  return {dbSize, clearCache}

}
