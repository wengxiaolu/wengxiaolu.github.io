import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSite } from "./render.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(readFileSync(join(root, "content/site.json"), "utf8"));
const files = renderSite(site);
const slugs = new Set(site.notes.map((note) => note.slug));

for (const [path, content] of Object.entries(files)) {
  if (path === "content/site.json") continue;
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

const notesDir = join(root, "notes");
for (const name of readdirSync(notesDir, { withFileTypes: true })) {
  if (name.isDirectory() && !slugs.has(name.name)) {
    rmSync(join(notesDir, name.name), { recursive: true, force: true });
  }
}

console.log(`built ${Object.keys(files).length - 1} files from content/site.json`);
