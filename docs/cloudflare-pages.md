# Cloudflare Pages deployment

SecurityCorp is exported as a static Next.js site for Cloudflare Pages.
GitHub is the source of truth; Cloudflare builds and deploys from it.

## Pages project settings

- Production branch: `main`
- Framework preset: `Next.js (Static HTML Export)`
- Build command: `npm run build:pages`
- Build output directory: `out`
- Root directory: `/`
- Node.js version: `22`

## Initial setup (do these in order)

1. Push the repository to GitHub (see the main `README.md` for local
   validation to run first).
2. In the Cloudflare dashboard, create a Pages project and connect the
   GitHub repository.
3. Set the project settings exactly as listed above. Cloudflare's Next.js
   preset may guess different defaults — override them.
4. Trigger the first deployment and confirm it builds and serves from the
   assigned `*.pages.dev` subdomain before touching DNS.

## Continuous deployment

Cloudflare builds every push to `main`. Pull requests receive preview
deployments automatically once the project is connected — no extra
configuration needed. No application secrets or runtime environment
variables are required for this static site.

## Protected article publication verification

Only a merge into the production branch (`main`) is publication; a local build
or pull-request Preview is not. For a publication-ready article:

1. Verify current GitHub and Gitea histories without overwriting divergent
   history, then branch from current approved GitHub `main`.
2. Push the focused branch to Gitea, confirm the one-way mirror exposes it on
   GitHub, and open a GitHub PR to `main`.
3. Wait for every required GitHub check. Merge only through the approved PR
   method—never by pushing article changes directly to `main`.
4. Confirm the Cloudflare Pages check is successful for the resulting GitHub
   `main` commit and identifies a Production deployment. Then verify the live
   article on `https://securitycorp.net`, its catalog/topic navigation, direct
   route, sitemap, RSS, metadata/social preview, responsive layout, and basic
   production health.
5. Because the mirror is one-way, fast-forward Gitea `main` to the GitHub
   merge commit when needed. Never force divergent history. Record the PR,
   merge commit, Cloudflare result, live URL, and residual limitations in the
   related Bead and operational record without copying sensitive output.

If Cloudflare fails, investigate and remediate through another focused branch
and protected PR; do not claim publication from a successful local build or
Preview deployment.

## Custom domain

Once the `*.pages.dev` deployment is verified:

1. Add `securitycorp.net` as a custom domain on the Pages project.
   Cloudflare will create the required DNS record automatically if the
   zone is managed in the same account — review the exact record it
   proposes before confirming, and don't let it touch unrelated existing
   DNS records in the zone.
2. Add `www.securitycorp.net` as a second custom domain, then redirect it
   to the apex (`securitycorp.net`). `public/_redirects` already
   canonicalizes `www` to the apex at the application layer, but Cloudflare
   may need a Bulk Redirect or a Page Rule at the account level to redirect
   at the edge before a request ever reaches the Pages build — don't assume
   the `_redirects` file alone is sufficient; check Cloudflare's own
   redirect behavior for the custom domain after adding it.
3. Redirect the default `*.pages.dev` hostname to the canonical domain, or
   at minimum confirm it isn't being indexed or linked anywhere, so search
   engines and inbound links converge on `securitycorp.net`.
4. Confirm Cloudflare issues a valid TLS certificate for both
   `securitycorp.net` and `www.securitycorp.net` before considering the
   domain cutover complete.
5. Verify HTTP redirects to HTTPS, `www` redirects to the apex, and there
   are no redirect loops or mixed-content warnings.

## Optional: Cloudflare Web Analytics

If visit analytics are wanted without third-party tracking, Cloudflare Web
Analytics can be enabled from the dashboard for the zone — it doesn't
require adding a tracking script dependency to the codebase. Not enabled
by default; enable it only if desired, and note it in this file once done.
