#!/usr/bin/env node

import process from "process";
import { initializeRuby } from "./rubyVM";

const main = async () => {
  const args = process.argv.slice(2);

  const ruby = await initializeRuby(args);
  let preset = `ARGV = ${JSON.stringify(args)};`;
  Object.entries(process.env).forEach(([k, v]) => {
    preset += `ENV["${k}"] = "${v}";`;
  })
  ruby.eval(preset);

  args.forEach((arg, i) => {
    if (arg.startsWith("-e")) {
      let code = arg.slice(2);
      if (code.startsWith("=")) {
        ruby.evalAsync(code.slice(1));
      } else if (code.length === 0) {
        ruby.evalAsync(process.argv[i + 3]);
      }
      ruby.evalAsync(code);
    }
  });

  let fileToRun;
  args.forEach((arg, i) => {
    if (arg.startsWith("-")) {
      fileToRun = undefined;
    } else if (args[i - 1]?.startsWith("-") && args[i - 1].length === 2) {
      fileToRun = undefined;
    } else {
      fileToRun ||= arg;
    }
  });

  if (fileToRun) {
    await ruby.evalAsync(`load "${fileToRun}"`);
  }
};

main()
  .then(() => process.exit(0));
