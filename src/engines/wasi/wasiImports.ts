import { Directory, OpenDirectory, WASI, wasi as wasiDefs } from "@bjorn3/browser_wasi_shim";

function pathDirAndFile(path: string) {
  const paths = path.split("/");
  const filename = paths.pop() as string;
  const dir_path = paths.join("/");
  return { filename, dir_path };
}

const tracedWasiImports = (wasi: WASI) => {
  for (const key in wasi.wasiImport) {
    const func = wasi.wasiImport[key]
    wasi.wasiImport[key] = function() {
      const ret = Reflect.apply(func, undefined, arguments);
      if (ret != 0) {
        console.log(`[tracing] WASI.${key} returns ${ret}. Arguments:`, ...arguments);
      }
      return ret;
    }
  }
  return wasi.wasiImport;
}

export const wasiImports = (wasi: WASI, options?: {debug?: boolean}) => {
  return {
    wasi_snapshot_preview1: {
      ...(options?.debug ? tracedWasiImports(wasi) : wasi.wasiImport),
      path_filestat_set_times: () => wasiDefs.ERRNO_SUCCESS,
      path_rename: (
        fd: number,
        old_path_ptr: number,
        old_path_len: number,
        new_fd: number,
        new_path_ptr: number,
        new_path_len: number
      ): number => {
        if (wasi.fds[fd] === undefined || wasi.fds[new_fd] == undefined) {
          return wasiDefs.ERRNO_BADF;
        }
        const decoder = new TextDecoder("utf-8");
        const buffer8 = new Uint8Array(wasi.inst.exports.memory.buffer);
        const old_path = decoder.decode(
          buffer8.slice(old_path_ptr, old_path_ptr + old_path_len)
        );
        const new_path = decoder.decode(
          buffer8.slice(new_path_ptr, new_path_ptr + new_path_len)
        );

        if (new_fd === fd && (wasi.fds[fd] instanceof OpenDirectory)) {
          const open_dir = wasi.fds[fd] as OpenDirectory;
          const dir = open_dir.dir;
          const clean_old_path = open_dir.clean_path(old_path);
          const clean_new_path = open_dir.clean_path(new_path);
          const old_path_entry = dir.get_entry_for_path(clean_old_path);
          if (old_path_entry === null) {
            return wasiDefs.ERRNO_NOENT;
          }
          if (dir.get_entry_for_path(clean_new_path) !== null) {
            return wasiDefs.ERRNO_EXIST;
          }

          const { filename: new_filename, dir_path: new_dir_path } = pathDirAndFile(clean_new_path);
          const new_dir = dir.create_entry_for_path(new_dir_path, true) as Directory;
          new_dir.contents[new_filename] = old_path_entry;

          const { filename: old_filename, dir_path: old_dir_path } = pathDirAndFile(clean_old_path);
          const old_dir = dir.get_entry_for_path(old_dir_path) as Directory;
          delete old_dir.contents[old_filename];

          return wasiDefs.ERRNO_SUCCESS;
        }

        throw new Error(`path_rename not implemented yet: ${fd} ${old_path} -> ${new_fd} ${new_path}`);
      }
    }
  };
};
