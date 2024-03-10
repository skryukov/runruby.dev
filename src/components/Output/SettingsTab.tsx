import { useMemo } from "react";
import { VscInfo } from "react-icons/vsc";
import { useLiveQuery } from "dexie-react-hooks";
import { useStore } from "@nanostores/react";

import { clearCache, formatBytes } from "../../useDBCacheInfo.ts";
import { $cache } from "../../stores/cache.ts";
import { db, DirectoryContents, MarshaledDirectory } from "../../db.ts";

import cs from "./SettingsTab.module.css";
import { $theme, setTheme, Theme } from "../../stores/theme.ts";

function findDirectory(dir: DirectoryContents, s: string) {
  const parts = s.split("/");
  let current = dir;
  for (const part of parts) {

    if (!(current[part] && "contents" in current[part])) {
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

export const SettingsTab = () => {
  const cache = useStore($cache);
  const theme = useStore($theme);

  const gemsDirContent = useLiveQuery(
    () => db.fsCache.get({ key: "gemsDir" }),
    []
  );

  const installedGemsDir = useMemo(() => (
    typeof gemsDirContent === "object" && ("data" in gemsDirContent) && findDirectory(gemsDirContent.data, "ruby/3.3.0/gems")
  ), [gemsDirContent]);


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
      <span className={cs.theme}>
        Editor theme
        <select
          className={cs.themeSelect}
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </span>

      <span className={cs.cacheInfoLabel}>
        Cached Gems
      </span>
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

      <span className={cs.cacheInfoLabel}>
        Gems Cache Size
        <button className={`${cs.clearCacheButton} ${canRunCacheClear ? "" : cs.buttonDisabled}`}
                onClick={clearCache}>Clear Cache
        </button>
      </span>
      <div className={cs.cacheInfoContent}>
        {cache.info.message !== undefined ? (
          <div>{cache.info.message}</div>
        ) : (
          <>
            <div>
              Estimated usage:{" "}
              {formatBytes(cache.info?.usage || 0)}/{formatBytes(cache.info?.quota || 0)}
              <div className={cs.tooltip}>
                <VscInfo />
                <span className={cs.tooltiptext}>
                  Storage space might not be immediately reclaimed after deleting data due to the browser's internal garbage collection processes.
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
