import { cpSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { basePath } from "./base-path.ts";

const ROOT = process.cwd();
const OUT = join(ROOT, "build", "client");
const BASE = basePath();
const SITE = "https://baznas.situs.id";

if (BASE !== "/") {
  const nested = join(OUT, BASE);
  if (existsSync(nested)) {
    cpSync(nested, OUT, { recursive: true });
    const topSeg = BASE.split("/").filter(Boolean)[0];
    if (topSeg) rmSync(join(OUT, topSeg), { recursive: true, force: true });
  }
}

const shell = join(OUT, "index.html");
if (!existsSync(shell)) throw new Error("postbuild: build/client/index.html is missing");
cpSync(shell, join(OUT, "404.html"));
writeFileSync(join(OUT, ".nojekyll"), "");
writeFileSync(join(OUT, "CNAME"), "baznas.situs.id\n");
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE}/</loc></url>\n</urlset>\n`,
);

rmSync(join(OUT, "storybook"), { recursive: true, force: true });
if (existsSync(join(ROOT, "build", "storybook"))) {
  cpSync(join(ROOT, "build", "storybook"), join(OUT, "storybook"), { recursive: true });
}
