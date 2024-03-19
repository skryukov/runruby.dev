import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { useVM } from "../../useVM.ts";
import { Output } from "../Output/Output.tsx";
import { Editor } from "../Editor/Editor.tsx";
import { Menu } from "../Menu/Menu.tsx";
import cs from "./Content.module.css";
import { db, DirectoryContents, mapToEntities } from "../../db.ts";
import { bundleDir, gemsDir } from "../../engines/wasi/wasi.ts";
import { $menu, toggleMenu } from "../../stores/menu.ts";
import { useStore } from "@nanostores/react";

export const Content = () => {
  const { loading, runVM } = useVM();

  const gemsDirContent = useLiveQuery(
    () => db.fsCache.get({key: "gemsDir"}),
    []
  );
  const bundleDirContent = useLiveQuery(
    () => db.fsCache.get({key: "bundleDir"}),
    []
  );

  const populatedGemsDir = useRef(false);
  useEffect(() => {
    if (gemsDirContent && bundleDirContent && !populatedGemsDir.current) {
      gemsDir.dir.contents = mapToEntities(gemsDirContent.data as DirectoryContents);
      bundleDir.dir.contents = mapToEntities(bundleDirContent.data as DirectoryContents);
      populatedGemsDir.current = true;
    }
  }, [gemsDirContent, bundleDirContent, populatedGemsDir]);

  const menuIsOpen = useStore($menu).isOpen;

  return (
    <div className={cs.content}>
      {menuIsOpen ? (<div className={cs.menuShadow} onClick={toggleMenu}></div>) : null}
      <div className={`${cs.menu} ${menuIsOpen ? cs.menuOpen : ''}`}>
        <Menu />
      </div>
      <div className={cs.editor}>
        <Editor
          loading={loading}
          runVM={runVM}
        />
      </div>
      <div className={cs.output}>
        <Output />
      </div>
    </div>
  );
};

