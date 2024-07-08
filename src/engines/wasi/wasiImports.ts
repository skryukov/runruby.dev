import { WASI } from "@bjorn3/browser_wasi_shim";

const tracedWasiImports = (wasi: WASI) => {
  for (const key in wasi.wasiImport) {
    const func = wasi.wasiImport[key];
    wasi.wasiImport[key] = function (...args) {
      const ret = Reflect.apply(func, undefined, args);
      if (ret != 0) {
        console.log(
          `[tracing] WASI.${key} returns ${ret}. Arguments:`,
          ...args,
        );
      }
      return ret;
    };
  }
  return wasi.wasiImport;
};

export const wasiImports = (wasi: WASI, options?: { debug?: boolean }) => {
  return {
    wasi_snapshot_preview1: {
      ...(options?.debug ? tracedWasiImports(wasi) : wasi.wasiImport),
    },
  };
};
