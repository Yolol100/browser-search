import { isIP } from "node:net";
import dns from "node:dns/promises";

const DEFAULT_HOSTS = "example.com";

export function allowedHosts(value = process.env.BROWSER_ALLOWED_HOSTS || DEFAULT_HOSTS) {
  const result = new Set();
  for (const item of value.split(",")) {
    const name = item.trim().toLowerCase();
    if (!name || name.length > 253 || isIP(name) || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(name)) {
      throw new Error("Invalid BROWSER_ALLOWED_HOSTS entry");
    }
    result.add(name);
  }
  if (result.size === 0 || result.size > 8) throw new Error("Invalid host allowlist size");
  return result;
}

export function safeUrl(input, hosts) {
  if (typeof input !== "string" || input.length > 2048) throw new Error("Invalid URL");
  let url;
  try { url = new URL(input); } catch { throw new Error("Invalid URL"); }
  if (url.protocol !== "https:" || url.username || url.password || url.port || isIP(url.hostname)) {
    throw new Error("Only standard HTTPS URLs with domain names are allowed");
  }
  if (!hosts.has(url.hostname.toLowerCase())) throw new Error("Domain is not allowlisted");
  url.hash = "";
  return url.toString();
}

export function isPublicIp(address) {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && (b === 168 || b === 0 || (b === 0 && c === 2))) return false;
    if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
    if (a === 203 && b === 0 && c === 113) return false;
    return true;
  }
  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    // Only ordinary global unicast IPv6; reject mapped, ULA, link-local and tunnels.
    const parts = lower.split(":");
    const first = Number.parseInt(parts[0], 16);
    const second = Number.parseInt(parts[1] || "0", 16);
    if (!Number.isFinite(first) || first < 0x2000 || first > 0x3fff) return false;
    if (first === 0x2001 && (second === 0 || second === 0xdb8)) return false;
    if (first === 0x2002 || first === 0x3ffe) return false;
    return true;
  }
  return false;
}

export async function assertPublicDns(urlString, lookup = dns.lookup) {
  const host = new URL(urlString).hostname;
  const addresses = await lookup(host, { all: true });
  if (!Array.isArray(addresses) || !addresses.length || addresses.some((item) => !isPublicIp(item.address))) {
    throw new Error("Blocked non-public DNS destination");
  }
}
