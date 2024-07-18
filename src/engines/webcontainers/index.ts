import { DirectoryNode, FileSystemTree, WebContainer } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import { composeInitialFS } from "../../fsInitializer.ts";

export let webcontainerInstance: WebContainer;

const mapFilesToFS = (
  files: { filename: string; content: string }[],
): FileSystemTree => {
  const fs: FileSystemTree = {};
  files.forEach((file) => {
    const path = file.filename.split("/");
    let current = fs;
    for (let i = 0; i < path.length; i++) {
      if (i === path.length - 1) {
        current[path[i]] = {
          file: {
            contents: file.content,
          },
        };
      } else {
        current[path[i]] ||= { directory: {} };
        current = (current[path[i]] as DirectoryNode).directory;
      }
    }
  });
  return fs;
};

window.addEventListener("load", async () => {
  webcontainerInstance = await WebContainer.boot({ workdirName: "runruby" });

  // mount project files
  const { files } = await composeInitialFS();
  // await webcontainerInstance.fs.mkdir("/home/app");
  await webcontainerInstance.mount(mapFilesToFS(files));

  // mount ruby cli
  await webcontainerInstance.fs.mkdir("bin");
  const snapshotResponse = await fetch(
    `${import.meta.env.VITE_ASSETS_URL}/ruby`,
  );
  const snapshot = await snapshotResponse.arrayBuffer();
  await webcontainerInstance.mount(snapshot, { mountPoint: "bin" });
  await webcontainerInstance.spawn("chmod", ["+x", "bin/ruby"]);
  await webcontainerInstance.spawn("chmod", ["+x", "bin/bundle"]);
  await webcontainerInstance.spawn("chmod", ["+x", "bin/bundler"]);

  await webcontainerInstance.fs.mkdir("gem_stubs");
  const snapshotResponse1 = await fetch(
    `${import.meta.env.VITE_ASSETS_URL}/stubs`,
  );
  const snapshot1 = await snapshotResponse1.arrayBuffer();
  await webcontainerInstance.mount(snapshot1, { mountPoint: "gem_stubs" });

  await webcontainerInstance.fs.mkdir("bundle");
  await webcontainerInstance.fs.mkdir("gems");
});

export const startShell = async (terminal: Terminal) => {
  while (!webcontainerInstance) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const fitAddon = new FitAddon();

  terminal.loadAddon(fitAddon);

  const shellProcess = await webcontainerInstance.spawn("jsh", {
    terminal: {
      cols: terminal.cols,
      rows: terminal.rows,
    },
    env: {
      PATH: `${webcontainerInstance.workdir}/bin:${webcontainerInstance.path}`,
    },
  });

  shellProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data);
      },
    }),
  );

  const input = shellProcess.input.getWriter();

  terminal.onData((data) => {
    input.write(data);
  });

  return shellProcess;
};
