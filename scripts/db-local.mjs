// Applies pending drizzle/*.sql migrations to the local preview D1 (.wrangler/state), once each.
// The app seeds the starting town on first load, so this is all a fresh checkout needs.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const config = "dist/server/wrangler.json";
if (!existsSync(config)) throw new Error(`${config} is missing: run "npm run build" once first.`);

function d1(args) {
  const r = spawnSync(process.execPath, ["--import", "./scripts/sites-env.mjs", "./node_modules/wrangler/bin/wrangler.js",
    "d1", "execute", "DB", "--local", "--config", config, "--persist-to", ".wrangler/state", "--json", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return JSON.parse(r.stdout);
}

const [{ results }] = d1(["--command", "CREATE TABLE IF NOT EXISTS local_migrations (id TEXT PRIMARY KEY); SELECT id FROM local_migrations;"]).slice(-1);
const applied = new Set(results.map((r) => r.id));
const pending = readdirSync("drizzle").filter((f) => f.endsWith(".sql") && !applied.has(f)).sort();
mkdirSync(".sites-runtime", { recursive: true });
for (const file of pending) {
  const sql = readFileSync(`drizzle/${file}`, "utf8").replaceAll("--> statement-breakpoint", "");
  writeFileSync(".sites-runtime/migration.sql", `${sql}\n;INSERT INTO local_migrations (id) VALUES ('${file}');\n`);
  d1(["--file", ".sites-runtime/migration.sql"]);
  console.log(`applied ${file}`);
}
console.log(pending.length ? `Local database ready (${pending.length} migrations).` : "Local database already up to date.");
