import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * pt-safe/px-safe definem o padding do elemento e vencem p-*, px-* e pt-* na mesma classe:
 * na tela do recibo isso zerou as margens laterais no iPhone. O padding da página fica
 * num elemento interno.
 */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx|css)$/.test(name) ? [path] : [];
  });
}

describe("áreas seguras do iPhone", () => {
  const root = join(process.cwd(), "src");

  it("não mistura pt-safe/px-safe com padding no mesmo elemento", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(root)) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/className="([^"]*)"/g)) {
        const classes = (match[1] ?? "").split(/\s+/);
        const hasSafeTop = classes.includes("pt-safe");
        const hasSafeSides = classes.includes("px-safe");
        if (!hasSafeTop && !hasSafeSides) continue;
        const clash = classes.filter(
          (name) =>
            !/-safe(-nav)?$/.test(name) &&
            (/^(print:|md:|lg:)?(p|px|pl|pr)-/.test(name) || (hasSafeTop && /^(print:|md:|lg:)?(py|pt)-/.test(name))),
        );
        if (clash.length > 0) offenders.push(`${file}: ${clash.join(" ")}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
