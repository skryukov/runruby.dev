import JSZip from "jszip";
import { walkFileTree } from "./engines/wasi/editorFS.ts";
import { saveAs } from "file-saver";

export const downloadZip = () => {
  const zip = new JSZip();

  walkFileTree(({ filename, contents }) => {
    zip.file(filename, contents);
  });

  zip.generateAsync({ type: "blob" }).then((blob) => {
    saveAs(blob, "runruby.zip");
  });
};
