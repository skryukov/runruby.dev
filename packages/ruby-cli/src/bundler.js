#!/usr/bin/env node

import process from "process";

import { initializeRuby } from "./rubyVM";

const bundler = async () => {
  const ruby = await initializeRuby([]);

  const args = process.argv.slice(2);
  ruby.eval(`ARGV = ${JSON.stringify(args)}`);

  await ruby.evalAsync(`
require "rubygems_stub"
require "thread_stub"
require "bundler_stub"

require "bundler"

require "bundler/friendly_errors"

Bundler.with_friendly_errors do
  require "bundler/cli"

  # Allow any command to use --help flag to show help for that command
  help_flags = %w[--help -h]
  help_flag_used = ARGV.any? {|a| help_flags.include? a }
  args = help_flag_used ? Bundler::CLI.reformatted_help_args(ARGV) : ARGV

  Bundler::CLI.start(args, debug: true)
end
`);
};

bundler()
  .then(() => process.exit(0));
