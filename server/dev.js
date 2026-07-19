import { spawn } from "node:child_process";
import process from "node:process";

const children = [
  spawn(
    process.execPath,
    ["--env-file-if-exists=.env", "server/bank-api.js"],
    { stdio: "inherit" }
  ),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], {
    stdio: "inherit",
  }),
];

let shuttingDown = false;

function stop(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach((child) => {
    if (!child.killed) child.kill();
  });
  process.exitCode = exitCode;
}

children.forEach((child) => {
  child.on("exit", (code, signal) => {
    if (!shuttingDown && code !== 0 && signal !== "SIGTERM") {
      stop(code || 1);
    }
  });
});

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
