import cs from "./CacheTab.module.css";
import { clearCache, formatBytes } from "../../useDBCacheInfo.ts";
import { useStore } from "@nanostores/react";
import { $cache } from "../../stores/cache.ts";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DirectoryContents, MarshaledDirectory } from "../../db.ts";
import { useMemo } from "react";

function findDirectory(dir: DirectoryContents, s: string) {
  const parts = s.split("/");
  let current = dir;
  for (const part of parts) {

    if (!("contents" in current[part])) {
      return undefined;
    }
    current = (current[part] as MarshaledDirectory).contents;
  }
  return current;
}

const combinedGems = (gems: [string, string][]) => gems.reduce((acc, [name, version]) => {
  if (acc[name] === undefined) {
    acc[name] = [];
  }
  acc[name].push(version);
  return acc;
}, {} as Record<string, string[]>);

export const CacheTab = () => {
  const cache = useStore($cache);

  const gemsDirContent = useLiveQuery(
    () => db.fsCache.get({key: "gemsDir"}),
    []
  );

  const installedGemsDir = useMemo(() => (
    typeof gemsDirContent === 'object' && ("data" in gemsDirContent) && findDirectory(gemsDirContent.data, "ruby/3.3.0/gems")
  ),[gemsDirContent])


  const gems = Object.keys(installedGemsDir || {}).map((gem) => {
    const parts = gem.split("-");
    const version = parts.pop();
    const name = parts.join("-");
    return [name, version] as [string, string];
  }).sort();

  const combinedGemsArray = Object.entries(combinedGems(gems)).map(([name, versions]) => {
    return [name, versions.join(", ")] as [string, string];
  });

  const canRunCacheClear = useLiveQuery(async () => (await db.fsCache.count()) > 0, []);

  return (
    <div className={cs.cacheInfo}>
      <label className={cs.cacheInfoLabel}>
        Cached Gems
      </label>
      <div className={cs.listOfGems}>
        {gems.length === 0 ? (
          <p>No gems cached</p>
        ) : (
          <ul>
            {combinedGemsArray.map((gem) => (
              <li key={gem[0] + gem[1]}>{gem[0]} ({gem[1]})</li>
            ))}
          </ul>
        )}
      </div>

      <label className={cs.cacheInfoLabel}>
        Gems Cache Size
      </label>
      <div className={cs.cacheInfoContent}>
        {cache.info.message !== undefined ? (
          <div>{cache.info.message}</div>
        ) : (
          <>
            <div>
              Calculated usage: {formatBytes(cache.info?.usage || 0)}
            </div>
            <button className={`${cs.clearCacheButton} ${canRunCacheClear ? "" : cs.buttonDisabled}`} onClick={clearCache}>Clear Cache
            </button>
          </>
        )}
      </div>
    </div>

  );
};
