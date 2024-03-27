import { useEffect, useState } from "react";
import { Terminal as Xterm } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

import { startShell } from "../../engines/webcontainers";

export const Terminal = () => {
  const [terminalRef, setTerminalRef] = useState<HTMLDivElement>();

  useEffect(() => {
    if (!terminalRef) return;
    const xterm = new Xterm({
      convertEol: true
    });
    startShell(xterm).then(() => {
      xterm.open(terminalRef);
    });

    return () => {
      xterm.dispose();
    };
  }, [terminalRef]);

  return <div ref={(node) => node && setTerminalRef(node)} />;
};
