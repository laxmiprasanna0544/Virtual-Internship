/**
 * Runs the production build exactly as the Docker image does
 * (node .next/standalone/server.js), with .env.local, on port 3100.
 *
 *   npm run build && npm run start:standalone
 */
import { cpSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
if (!existsSync(`${root}.next/standalone/server.js`)) {
  console.error("No standalone build. Run `npm run build` first.");
  process.exit(1);
}
cpSync(`${root}public`, `${root}.next/standalone/public`, { recursive: true });
cpSync(`${root}.next/static`, `${root}.next/standalone/.next/static`, { recursive: true });

const child = spawn(process.execPath, ["--env-file=.env.local", ".next/standalone/server.js"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production", PORT: process.env.PORT ?? "3100", HOSTNAME: "0.0.0.0" },
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
