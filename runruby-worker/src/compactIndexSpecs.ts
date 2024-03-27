import { IRequest, StatusError } from "itty-router";

type GemDependency = [name: string, versions: string[]];

type GemInfo = {
  gem: string;
  version: string;
  platform: string | null;
  dependencies: GemDependency[];
  options: GemDependency[];
};

// cloudflare limits subrequests to 50
const REQUESTS_LIMIT = 50;

const checkVersion = (options: GemDependency[], key: string, version: string): boolean => {
  const option = options.find(e => e[0] === key);
  if (option) {
    for (const ver of option[1]) {
      const match = ver.match(/([~<])\s*(\d+)\./);
      if (match) {
        const operator = match[1];
        const majorVersion = parseInt(match[2]);
        if ((operator === "~>" && majorVersion < parseInt(version)) || (operator === "<" && majorVersion <= parseInt(version))) {
          return true;
        }
      }
    }
  }
  return false;
};

export default async (request: IRequest) => {
  const depth = request.query.depth;
  const maxDepth = typeof depth === "string" ? parseInt(depth) : 50;
  if (typeof request.query.gems !== "string") {
    throw new StatusError(422, "Gems required.");
  }

  let subrequests = 0;

  const gemNames = request.query.gems.split(",");
  const gemInfo: GemInfo[] = [];
  let completeGems: string[] = [];
  let remainingGems = gemNames.slice(0, REQUESTS_LIMIT - subrequests);
  const gemsOverflow = remainingGems.slice(REQUESTS_LIMIT - subrequests);

  while (remainingGems.length > 0 && (subrequests + remainingGems.length) <= REQUESTS_LIMIT) {
    const depFetches = remainingGems.map(async (gem) => {
      const response = await fetch(`https://index.rubygems.org/info/${gem}`, { cf: { cacheEverything: true } });
      subrequests++;

      if (!response.ok) {
        return null;
      }

      const lines = (await response.text()).split("\n").slice((maxDepth + 1) * -1, -1);
      const gemInfo: GemInfo[] = [];

      lines.forEach(line => {
        const parts = line.split("|");
        if (parts.length < 2) return;

        const version = parts[0].split(" ")[0].split("-")[0];

        // ignore pre-release versions
        if (version.match(/[a-z]|[A-Z]/)) return null;

        const platform = parts[0].split(" ")[0].split("-").slice(1).join("-") || null;

        // ignore platform specific gems
        if (platform) return null;

        const dependencies: GemDependency[] = parts[0].split(" ")[1] ? parts[0].split(" ").slice(1).join(" ").split(",").map(e => e.split(":")).map(e => ([e[0], e[1].split("&")])) : [];

        // ignore bundler < 2
        if (checkVersion(dependencies, "bundler", "2")) return null;

        const options: GemDependency[] = parts[1].split(",").map(e => e.split(":")).map(e => ([e[0], e[1].split("&")]));

        // ignore ruby < 3 and rubygems < 3
        if (checkVersion(options, "ruby", "3")) return null;
        if (checkVersion(options, "rubygems", "3")) return null;

        gemInfo.push({ gem, version, platform, dependencies, options });
      });

      return gemInfo;
    });
    const gemsDeps = (await Promise.all(depFetches)).filter(e => e !== null) as GemInfo[][];

    const nextGems = [...new Set(gemsDeps.map(dep => dep.map(d => d.dependencies.map(e => e[0])).flat()).flat())];

    gemsDeps.forEach(dep => gemInfo.push(...dep));

    completeGems.push(...new Set(gemsDeps.map(dep => dep.map(d => d.gem)).flat()));

    completeGems = [...new Set(completeGems)];

    remainingGems = nextGems.filter(gem => !completeGems.includes(gem));
  }

  return {
    specs: gemInfo.map(Object.values),
    completeGems,
    remainingGems: gemsOverflow.concat(remainingGems).filter(gem => !completeGems.includes(gem))
  };
};
