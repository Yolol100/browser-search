import test from "node:test";
import assert from "node:assert/strict";
import { allowedHosts, safeUrl, isPublicIp, assertPublicDns } from "../src/security.mjs";

test("URL allowlist accepts only HTTPS allowed domains", () => {
  const hosts = allowedHosts("example.com,developer.mozilla.org");
  assert.equal(safeUrl("https://example.com/a#fragment", hosts), "https://example.com/a");
  assert.equal(safeUrl("https://developer.mozilla.org/", hosts), "https://developer.mozilla.org/");
  for (const url of [
    "http://example.com/",
    "https://example.com.evil.tld/",
    "https://127.0.0.1/",
    "https://user:pass@example.com/",
    "https://example.com:8080/",
    "file:///etc/passwd",
    "https://localhost/"
  ]) assert.throws(() => safeUrl(url, hosts));
});

test("invalid allowlist entries are refused", () => {
  for (const value of ["127.0.0.1", "localhost", "*.example.com", "", "http://example.com"]) {
    assert.throws(() => allowedHosts(value));
  }
});

test("private, reserved and loopback IPs are refused", () => {
  for (const ip of ["127.0.0.1", "10.0.0.2", "192.168.1.1", "172.16.4.5",
                    "169.254.169.254", "100.64.0.1", "192.0.2.3", "::1",
                    "fc00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "2001:db8::1", "2002::1"]) {
    assert.equal(isPublicIp(ip), false, ip);
  }
  assert.equal(isPublicIp("93.184.215.14"), true);
  assert.equal(isPublicIp("2606:2800:220:1:248:1893:25c8:1946"), true);
});

test("DNS check rejects private answers and missing answers", async () => {
  await assert.rejects(assertPublicDns("https://example.com", async () => [{address: "127.0.0.1"}]));
  await assert.rejects(assertPublicDns("https://example.com", async () => []));
  await assert.doesNotReject(assertPublicDns("https://example.com", async () => [{address: "93.184.215.14"}]));
});
