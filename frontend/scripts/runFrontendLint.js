import { spawnSync } from "child_process";

const scripts = ["lint:js", "lint:style", "check:theme-colors"];
let failed = false;

for (const script of scripts) {
  const result = spawnSync("npm", ["run", script], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
