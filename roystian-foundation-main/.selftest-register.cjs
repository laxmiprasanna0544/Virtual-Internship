const path = require("path");
const Module = require("module");
const root = path.join(__dirname, ".selftest");
const original = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  // The real package throws outside a React Server Components build.
  if (request === "server-only") return path.join(__dirname, "scripts", "server-only-stub.cjs");
  if (request.startsWith("@/")) {
    request = path.join(root, request.slice(2));
  }
  return original.call(this, request, ...args);
};
