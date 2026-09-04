## Summary

<!-- What does this change do, and why? -->

## Security impact

- [ ] This change does not introduce new secrets, credentials, or tokens
- [ ] This change does not weaken existing security headers, CSP, or CI/CD permissions
- [ ] This change does not add a new third-party dependency, action, or script without review
- [ ] Any new dependency/action is pinned (lockfile entry / commit SHA)
- [ ] No private infrastructure details (IPs, hostnames, real file paths) are introduced — see `SECURITY.md`

## Testing

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] `npm run build:pages` succeeds locally
- [ ] `npm run check:article-visuals` passes (if this PR touches an article's `coverImage` or the visual-audit script itself)
- [ ] Manually verified the change in a browser (if UI-affecting)

## Rollback

<!-- How would this change be reverted if it caused an issue after merge? -->
