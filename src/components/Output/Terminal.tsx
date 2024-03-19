import { useEffect, useRef } from "react";
import { Terminal as Xterm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const xterm = new Xterm({
  convertEol: true
});
const fitAddon = new FitAddon();

export const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      xterm.loadAddon(fitAddon);
      xterm.open(terminalRef.current);
      fitAddon.fit();
    }
  }, [terminalRef]);

  return <div ref={terminalRef} />;
};
