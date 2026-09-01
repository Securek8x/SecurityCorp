import assert from "node:assert/strict";
import { test } from "node:test";
import { findImageMetadata, scanTextAgainstDenylist, scanTextForLeaks } from "./privacy-leak-gate.ts";

test("blocks private IPv4 ranges (RFC 1918, loopback, link-local)", () => {
  const cases = ["10.1.2.3", "172.16.0.1", "172.31.255.254", "192.168.1.1", "127.0.0.1", "169.254.1.1"];
  for (const ip of cases) {
    const findings = scanTextForLeaks(`internal host at ${ip} handled the request`, "fixture");
    assert.ok(
      findings.some((f) => f.rule === "private-ipv4" && f.match === ip),
      `expected ${ip} to be flagged as private-ipv4`,
    );
  }
});

test("permits RFC 5737 documentation IPv4 ranges", () => {
  const cases = ["192.0.2.10", "198.51.100.23", "203.0.113.7"];
  for (const ip of cases) {
    const findings = scanTextForLeaks(`example host at ${ip} in a diagram`, "fixture");
    assert.equal(findings.length, 0, `expected ${ip} to be permitted, got: ${JSON.stringify(findings)}`);
  }
});

test("blocks private IPv6 (RFC 4193 unique local) and permits RFC 3849 documentation prefix", () => {
  const blocked = scanTextForLeaks("internal service at fd12:3456:789a:1::1", "fixture");
  assert.ok(blocked.some((f) => f.rule === "private-ipv6"));

  const permitted = scanTextForLeaks("example address 2001:db8::1 in a diagram", "fixture");
  assert.equal(permitted.filter((f) => f.rule === "private-ipv6").length, 0);
});

test("blocks internal-domain patterns", () => {
  for (const domain of ["server1.internal", "db.corp", "host.lan", "gateway.home.arpa"]) {
    const findings = scanTextForLeaks(`reachable at ${domain} only on the VPN`, "fixture");
    assert.ok(findings.some((f) => f.rule === "internal-domain"), `expected ${domain} to be flagged`);
  }
});

test("blocks real-looking email addresses but permits approved placeholder domains", () => {
  const blocked = scanTextForLeaks("contact admin@realcompany.com for access", "fixture");
  assert.ok(blocked.some((f) => f.rule === "email-address"));

  const permitted = scanTextForLeaks("contact admin@example.com for access", "fixture");
  assert.equal(permitted.filter((f) => f.rule === "email-address").length, 0);
});

test("blocks absolute filesystem paths (home dir, /Users, /mnt, Windows drive) but permits site-relative URLs", () => {
  const blockedCases = [
    "traced to /home/ravi/projects/secret-notes",
    "found in /Users/ravi/Documents/keys",
    "mounted at /mnt/c/Users/ravi/CODE/private-repo",
    "stored at C:\\Users\\ravi\\secrets",
  ];
  for (const text of blockedCases) {
    const findings = scanTextForLeaks(text, "fixture");
    assert.ok(findings.some((f) => f.rule === "absolute-filesystem-path"), `expected a path finding in: ${text}`);
  }

  const permitted = scanTextForLeaks("read more at /knowledge/some-article-slug", "fixture");
  assert.equal(permitted.filter((f) => f.rule === "absolute-filesystem-path").length, 0);
});

test("blocks known credential formats and redacts the reported match", () => {
  const findings = scanTextForLeaks("token AKIAABCDEFGHIJKLMNOP leaked in a log", "fixture");
  const finding = findings.find((f) => f.rule === "credential-aws-access-key");
  assert.ok(finding, "expected an aws-access-key finding");
  assert.ok(finding && finding.match.includes("(redacted)"), "match should be redacted, not the full secret");
  assert.ok(finding && !finding.match.includes("ABCDEFGHIJKLMNOP"), "full secret must not appear in the finding");
});

test("blocks PEM private key headers", () => {
  const findings = scanTextForLeaks("-----BEGIN RSA PRIVATE KEY-----\nMIIB...", "fixture");
  assert.ok(findings.some((f) => f.rule === "credential-pem-private-key"));
});

test("blocks suspicious log-style secret assignments but permits obvious placeholders", () => {
  const blocked = scanTextForLeaks("password=hunter22isreal", "fixture");
  assert.ok(blocked.some((f) => f.rule === "suspicious-log-fragment"));

  for (const text of ["API_KEY=<your-key-here>", "password=changeme", "secret=process.env.SECRET"]) {
    const findings = scanTextForLeaks(text, "fixture");
    assert.equal(
      findings.filter((f) => f.rule === "suspicious-log-fragment").length,
      0,
      `expected placeholder to be permitted: ${text}`,
    );
  }
});

test("permits ordinary prose with no sensitive shapes", () => {
  const findings = scanTextForLeaks(
    "This guide explains how to configure a reverse proxy and rotate credentials safely using a secrets manager.",
    "fixture",
  );
  assert.equal(findings.length, 0);
});

test("scanTextAgainstDenylist flags configured terms and is case-insensitive", () => {
  const denylist = { terms: ["realusername", "Internal-Project-Codename"] };
  const findings = scanTextAgainstDenylist("mentions RealUsername and internal-project-codename here", denylist, "fixture");
  assert.equal(findings.length, 2);
  assert.ok(findings.every((f) => f.rule === "local-denylist-term"));
});

test("scanTextAgainstDenylist ignores blank entries and returns nothing for an empty denylist", () => {
  const findings = scanTextAgainstDenylist("some text", { terms: ["", "  "] }, "fixture");
  assert.equal(findings.length, 0);
});

function jpegWithExif(): Uint8Array {
  const app1Data = Buffer.from("Exif\0\0MM\0*");
  const segmentLength = app1Data.length + 2;
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.from([0xff, 0xe1, (segmentLength >> 8) & 0xff, segmentLength & 0xff]),
      app1Data,
      Buffer.from([0xff, 0xd9]),
    ]),
  );
}

function jpegWithoutExif(): Uint8Array {
  return new Uint8Array(Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
}

function pngWithTextChunk(): Uint8Array {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const textData = Buffer.from("tEXtAuthor\0Ravi");
  const length = textData.length - 4;
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(length, 0);
  const crc = Buffer.alloc(4);
  const iendLength = Buffer.alloc(4);
  const iend = Buffer.concat([iendLength, Buffer.from("IEND"), Buffer.alloc(4)]);
  return new Uint8Array(Buffer.concat([signature, lengthBuf, textData, crc, iend]));
}

function pngWithoutMetadata(): Uint8Array {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const iendLength = Buffer.alloc(4);
  const iend = Buffer.concat([iendLength, Buffer.from("IEND"), Buffer.alloc(4)]);
  return new Uint8Array(Buffer.concat([signature, iend]));
}

test("findImageMetadata blocks a JPEG carrying an Exif APP1 segment", () => {
  const findings = findImageMetadata(jpegWithExif(), "fixture.jpg");
  assert.ok(findings.some((f) => f.rule === "image-exif-metadata"));
});

test("findImageMetadata permits a JPEG with no Exif segment", () => {
  const findings = findImageMetadata(jpegWithoutExif(), "fixture.jpg");
  assert.equal(findings.length, 0);
});

test("findImageMetadata blocks a PNG carrying a tEXt metadata chunk", () => {
  const findings = findImageMetadata(pngWithTextChunk(), "fixture.png");
  assert.ok(findings.some((f) => f.rule === "image-png-metadata-chunk"));
});

test("findImageMetadata permits a PNG with no metadata chunks", () => {
  const findings = findImageMetadata(pngWithoutMetadata(), "fixture.png");
  assert.equal(findings.length, 0);
});

test("findImageMetadata returns nothing for a non-image byte sequence", () => {
  const findings = findImageMetadata(new Uint8Array([0x00, 0x01, 0x02, 0x03]), "fixture.bin");
  assert.equal(findings.length, 0);
});
