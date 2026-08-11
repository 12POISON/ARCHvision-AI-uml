import { pathToFileURL, fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const root = pathToFileURL(process.cwd() + "/").href;

export async function resolve(specifier, context, next) {
  if (typeof specifier === "string" && specifier.startsWith("@/")) {
    const bare = specifier.slice(2);
    for (const candidate of [bare, `${bare}.ts`, `${bare}.tsx`, `${bare}/index.ts`]) {
      const url = new URL(candidate, root);
      if (existsSync(fileURLToPath(url))) {
        return { url: url.href, shortCircuit: true };
      }
    }
    throw new Error(`Alias loader: cannot resolve "${specifier}"`);
  }
  return next(specifier, context);
}