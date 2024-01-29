import { runWASI } from "./engines/wasi";

const setStdout = (line: string) => postMessage({ type: "stdout", data: line });
const setStderr = (line: string) => postMessage({ type: "stderr", data: line });
const setResult = (line: any) => {
  postMessage({ type: "result", data: line });
};

onmessage = function(e) {
  switch (e.data.type) {
    case "installGem":
      const gem = e.data.gem;
      console.log("Worker: Installing gem", gem);
      const code = `a = Gem::Commands::InstallCommand.new; a.install_gem("${gem}", nil); a.installed_specs.map { [_1.name, _1.version.to_s] }.to_h`;

      runWASI({ code, setResult, setStdout, setStderr })
        .then((result) => {
          const version = result.toJS()[gem];
          postMessage({ type: "installed", data: { version } });
        })
        .catch((err) => {
          setStderr(err);
          postMessage({ type: "error", data: err });
        });
      break;
    case "runCode":
      console.log("Worker: Running code", e.data.code);
      runWASI({ code: e.data.code, setResult, setStdout, setStderr })
        .catch((err) => {
          setStderr(err);
          postMessage({ type: "error", data: err });
        });
      break;
    default:
      console.log("Worker: Unknown type received from main script");
      postMessage("Unknown command: " + e.data.type);
  }
};
