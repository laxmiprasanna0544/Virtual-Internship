/**
 * Runs every integration suite in order and records the evidence:
 *
 *   docs/test-evidence/<suite>.log   full output of each suite
 *   docs/test-evidence/summary.json  counts, durations and environment
 *
 * Needs the app running (npm run start:standalone) and the local
 * stand-ins set up (npm run local:up && npm run local:setup).
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const ROOT = new URL("../..", import.meta.url).pathname;
const OUT = `${ROOT}docs/test-evidence`;
mkdirSync(OUT, { recursive: true });

const suites = ["crypto", "rls", "auth", "journey", "payments", "admin", "career", "security"];
const only = process.argv.slice(2);
const selected = only.length ? suites.filter((s) => only.includes(s)) : suites;

function run(suite) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [`scripts/tests/${suite}.test.mjs`], { cwd: ROOT });
    let output = "";
    child.stdout.on("data", (d) => {
      output += d;
      process.stdout.write(d);
    });
    child.stderr.on("data", (d) => {
      output += d;
      process.stderr.write(d);
    });
    child.on("close", (code) => {
      const ms = Date.now() - started;
      const header = `# ${suite} — ${new Date(started).toISOString()} — exit ${code} — ${(ms / 1000).toFixed(1)}s\n\n`;
      writeFileSync(`${OUT}/${suite}.log`, header + output);
      const match = /(\d+) passed, (\d+) failed(?:, (\d+) skipped)?/.exec(output);
      resolve({
        suite,
        exitCode: code,
        seconds: Number((ms / 1000).toFixed(1)),
        passed: match ? Number(match[1]) : 0,
        failed: match ? Number(match[2]) : null,
        skipped: match ? Number(match[3] ?? 0) : 0,
        skips: output.split("\n").filter((l) => l.startsWith("SKIP")).map((l) => l.slice(6)),
      });
    });
  });
}

const results = [];
for (const suite of selected) {
  console.log(`\n=================== ${suite} ===================`);
  results.push(await run(suite));
}

const totals = results.reduce(
  (t, r) => ({ passed: t.passed + r.passed, failed: t.failed + (r.failed ?? 1), skipped: t.skipped + r.skipped }),
  { passed: 0, failed: 0, skipped: 0 },
);
writeFileSync(
  `${OUT}/summary.json`,
  JSON.stringify(
    {
      ranAt: new Date().toISOString(),
      node: process.version,
      environment: "local stand-ins: postgres:17, S3 emulator (for Spaces), Cashfree mock; built-in auth; emails to a local outbox",
      totals,
      suites: results,
    },
    null,
    2,
  ) + "\n",
);

console.log("\n=================== summary ===================");
for (const r of results) {
  console.log(`${r.failed === 0 && r.exitCode === 0 ? "PASS" : "FAIL"}  ${r.suite.padEnd(9)} ${r.passed} passed, ${r.failed ?? "?"} failed, ${r.skipped} skipped (${r.seconds}s)`);
}
console.log(`TOTAL  ${totals.passed} passed, ${totals.failed} failed, ${totals.skipped} skipped`);
process.exit(results.every((r) => r.exitCode === 0) ? 0 : 1);
