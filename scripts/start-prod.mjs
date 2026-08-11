import { existsSync, cpSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Production launcher for Next.js standalone output.
 * `next build --output standalone` emits .next/standalone/server.js but does not
 * copy the static assets or the public/ directory — do that here, then boot.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standalone = join(root, ".next", "standalone");

if (!existsSync(join(standalone, "server.js"))) {
  console.error("[start] Missing .next/standalone/server.js — run `npm run build` first.");
  process.exit(1);
}

for (const [from, to] of [
  [join(root, ".next", "static"), join(standalone, ".next", "static")],
  [join(root, "public"), join(standalone, "public")],
]) {
  if (!existsSync(from)) {
    console.warn(`[start] Skipping missing path: ${from}`);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`[start] Copied ${from} -> ${to}`);
}

const server = spawn(process.execPath, [join(standalone, "server.js")], {
  cwd: standalone,
  stdio: "inherit",
  env: { ...process.env, HOSTNAME: process.env.HOSTNAME ?? "0.0.0.0", PORT: process.env.PORT ?? "3000" },
});

server.on("exit", (code) => process.exit(code ?? 1));