import { RbValue } from "@ruby/wasm-wasi";
import { runWASI } from "./engines/wasi";
import { useCallback, useState } from "react";

export type RunVMParams = {
  code: string,
  onBefore?: () => void,
  onSuccess?: (result: RbValue) => void,
  onError?: (error: Error) => void,
  onFinally?: () => void
};

export const useVM = () => {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState("");

  const runVM = useCallback(({ code, onBefore, onSuccess, onError, onFinally }: RunVMParams) => {
    setLoading(true);
    setLog([]);
    setResult("");
    onBefore && onBefore();
    const setStdout = (line: string) => {
      console.log(line);
      setLog((old) => [...old, `[info] ${line}`]);
    };
    const setStderr = (line: string) => {
      console.warn(line);
      setLog((old) => [...old, `[error] ${line}`]);
    };
    // setTimeout is needed to allow the loading status to render
    setTimeout(() =>
        runWASI({ code, setResult, setStdout, setStderr })
          .then((result) => {
            onSuccess && onSuccess(result);
          })
          .catch((err) => {
            setLog((old) => [...old, `[error] ${err}`]);
            onError && onError(err);
          })
          .finally(() => {
            setLoading(false);
            onFinally && onFinally();
          })
      , 20);
  }, []);
  return { loading, log, result, runVM };
}
