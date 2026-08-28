# Security

SecurityCorp is a static site with no backend, no database, and no
application secrets — the attack surface is small by design. Still, two
things matter here: reporting a real vulnerability, and keeping this
author's home lab private while writing about it.

## Reporting a vulnerability

If you find a security issue with the site itself (header misconfiguration,
XSS via content rendering, dependency vulnerability, etc.), open a GitHub
issue or contact the author directly rather than filing a public exploit
writeup first. There's no bug bounty — this is a personal publication — but
real reports are welcome and will be fixed.

Do not test against `securitycorp.net` in ways that could affect other
visitors (no DoS testing, no scanning at volume). Fine to poke at headers,
TLS config, and static asset behavior.

## Pre-publish privacy checklist

Every article is inspired by real infrastructure. Before anything is
committed or pushed, it must not contain:

- [ ] Private IP addresses (LAN ranges, VPN-assigned addresses)
- [ ] Public egress IP addresses (home ISP or VPN exit IPs)
- [ ] Internal hostnames or private DNS records
- [ ] Credentials, API keys, tokens, passwords, or session identifiers
- [ ] Usernames tied to real accounts
- [ ] Certificate or SSH private key material
- [ ] Real filesystem paths (`/home/<user>/...`, actual mount points)
- [ ] Tracker, analytics, or account identities
- [ ] Exact firewall rules or port-forwarding config tied to one network
- [ ] Anything else that makes a specific home network easier to target

Generalized examples are fine and preferred — `10.0.x.x`, `service.internal`,
`<app>`, `<vpn>` style placeholders. The lesson survives generalization; the
specific environment shouldn't be identifiable from it.

## Before pushing to `main`

Run a quick local secret scan on the diff, not just a visual read:

```bash
git diff --cached | grep -Ei 'password|secret|token|api[_-]?key|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY'
git diff --cached | grep -Eo '([0-9]{1,3}\.){3}[0-9]{1,3}'
```

Neither command should return anything real. If either does, stop and
generalize the content before committing — not after.
