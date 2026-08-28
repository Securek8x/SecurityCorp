# Cloudflare Pages deployment

SecurityCorp is exported as a static Next.js site for Cloudflare Pages.
GitHub is the source of truth; Cloudflare builds and deploys from it.
Nothing below has been performed yet — this is the setup procedure to
follow once the repository is pushed to GitHub.

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
