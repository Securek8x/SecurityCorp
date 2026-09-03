// Automated expiry warning for /.well-known/security.txt (Bead
// securitycorp-source-tzm). RFC 9116 recommends the Expires field stay
// under a year out and be re-signed before it lapses — a stale/expired
// security.txt is treated by scanners as effectively absent. This runs as
// part of the standard validation suite so it gets checked on every batch
// that ships, well ahead of the actual date.
import { SECURITY_TXT_EXPIRES, getSecurityTxtExpiryStatus } from "../lib/security-txt.ts";

const status = getSecurityTxtExpiryStatus();

if (status === "expired") {
  console.error(
    `[security-txt] BLOCKED: security.txt's Expires (${SECURITY_TXT_EXPIRES}) has already passed. Re-sign it now — update SECURITY_TXT_EXPIRES in lib/security-txt.ts to a new date less than a year out.`,
  );
  process.exit(1);
}

if (status === "expiring-soon") {
  console.warn(
    `[security-txt] WARNING: security.txt's Expires (${SECURITY_TXT_EXPIRES}) is within 30 days. Plan to re-sign it soon — update SECURITY_TXT_EXPIRES in lib/security-txt.ts.`,
  );
  process.exit(0);
}

console.log(`[security-txt] OK: Expires (${SECURITY_TXT_EXPIRES}) is more than 30 days out.`);
