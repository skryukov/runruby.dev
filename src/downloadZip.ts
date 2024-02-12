import JSZip from "jszip";
import { Directory, File } from "@bjorn3/browser_wasi_shim";
import { decode, workDir } from "./engines/wasi/editorFS.ts";
import { saveAs } from "file-saver";

export const downloadZip = () => {
  const zip = new JSZip();
  const addFile = (dir: Directory, path: string) => {
    Object.entries(dir.contents).forEach(([name, file]) => {
      if (file instanceof Directory) {
        addFile(file, `${path}/${name}`);
      } else {
        zip.file(`${path}/${name}`, decode((file as File).data));
      }
    });
  };
  addFile(workDir.dir, "");
  zip.generateAsync({ type: "blob" }).then((blob) => {
    saveAs(blob, "runruby.zip");
  });
};
