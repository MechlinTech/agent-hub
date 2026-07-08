/** npm dist-tag used in generated package.json and install commands. */
export const PKG_LATEST = "latest";

/** Dependency map with every package set to the latest dist-tag. */
export function latestDeps(...packages: string[]): Record<string, string> {
  return Object.fromEntries(packages.map((name) => [name, PKG_LATEST]));
}

/** Append @latest to each package name for npm install args. */
export function asLatest(...packages: string[]): string[] {
  return packages.map((name) => `${name}@${PKG_LATEST}`);
}

/** npm install pkg@latest ... */
export function installLatestArgs(...packages: string[]): string[] {
  if (packages.length === 0) return ["install"];
  return ["install", ...asLatest(...packages)];
}

/** npm install -D pkg@latest ... */
export function installLatestDevArgs(...packages: string[]): string[] {
  return ["install", "-D", ...asLatest(...packages)];
}

/**
 * npm install devPkg@latest --save-dev prodPkg@latest ...
 * Matches npm's flag placement: packages before --save-dev go to devDependencies.
 */
export function installLatestSaveDevThenProd(
  devPackages: string[],
  prodPackages: string[],
): string[] {
  const args = ["install", ...asLatest(...devPackages)];
  if (devPackages.length > 0) args.push("--save-dev");
  args.push(...asLatest(...prodPackages));
  return args;
}
