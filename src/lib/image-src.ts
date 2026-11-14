// next/image can resize local files and the hosts allowed in next.config.mjs;
// anything else is shown as-is.
const OPTIMIZABLE_HOSTS = new Set(["i.ibb.co", "fotolaminate.com", "www.fotolaminate.com"]);

export function canOptimize(src: string): boolean {
  if (src.startsWith("/")) return !src.startsWith("//");
  try {
    return OPTIMIZABLE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}
