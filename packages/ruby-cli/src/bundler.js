#!/usr/bin/env node

import process from "process";
import { initializeRuby } from "./rubyVM";
import path from "path";
import { readFileSync } from "node:fs";

const bundler = async () => {
  const ruby = await initializeRuby([]);
  const args = process.argv.slice(2);

  const setRubyEnv = (rubyInstance, rubyArgs) => {
    let preset = `ARGV = ${JSON.stringify(rubyArgs)};`;
    Object.entries(process.env).forEach(([k, v]) => {
      preset += `ENV["${k}"] = "${v}";`;
    });
    rubyInstance.eval(preset);
  };

  const executeRubyFile = async (rubyInstance, filePath) => {
    const fileContent = readFileSync(filePath, "utf-8");
    await rubyInstance.evalAsync(`
      require "rubygems_stub"
      require "bundler_stub"
      require "bundler/setup"
       
      eval(<<~'CODE', binding, '${filePath}', 1)
      ${fileContent}
      CODE
    `);
  };

  const executeBundlerCLI = async (rubyInstance, cliArgs) => {
    rubyInstance.eval(`ARGV = ${JSON.stringify(cliArgs)}`);

    await rubyInstance.evalAsync(`
      require "rubygems_stub"
      require "thread_stub"
      require "bundler_stub"
      require "bundler"
      require "bundler/friendly_errors"
      Bundler.with_friendly_errors do
        require "bundler/cli"
        help_flags = %w[--help -h]
        help_flag_used = ARGV.any? { |a| help_flags.include? a }
        args = help_flag_used ? Bundler::CLI.reformatted_help_args(ARGV) : ARGV
        Bundler::CLI.start(args, debug: true)
      end
    `);
  };

  if (args[0] === "exec" && args[1] === "ruby") {
    const rubyArgs = args.slice(2);
    const rubyFile = rubyArgs.pop();

    if (!rubyFile) {
      console.error("Ruby file doesn't exist");
      process.exit(1);
    }

    setRubyEnv(ruby, rubyArgs);

    const filePath = path.resolve(rubyFile);
    await executeRubyFile(ruby, filePath);
  } else {
    await executeBundlerCLI(ruby, args);
  }
};

bundler()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
