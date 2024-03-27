#!/usr/bin/env node

import fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { snapshot } from "@webcontainer/snapshot";

const __dirname = dirname(fileURLToPath(import.meta.url));

execSync("npm i && npm run build", { cwd: join(__dirname, "../packages/ruby-cli") });

const stubs = await snapshot(join(__dirname, "../src/stubs"));
const ruby = await snapshot(join(__dirname, "../packages/ruby-cli/dist"));

fs.writeFileSync("./public/fs/stubs", stubs);
fs.writeFileSync("./public/fs/ruby", ruby);
