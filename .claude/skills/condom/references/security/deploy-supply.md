# Security: how the app is deployed (DEPLOY) and what it depends on (SUPPLY)

Scope: settings, headers, hosting, DNS and backups around the app (DEPLOY), and the packages, scripts, build pipeline and AI-agent config that run inside or beside it (SUPPLY). Written for Next.js (App Router) on Vercel with Supabase first. Every quote below was read at the source on 2026-11-16. Next.js moved to a monthly pre-announced security release in July 2026, so version advice goes stale in weeks: re-read https://nextjs.org/blog before quoting a version number. Where this file says "your site", prove it with a request to the owner's own deployment only.

## Contents
| ID | Plain name |
|---|---|
| SEC-SUPPLY-02 | Old Next.js or React with known remote-code-execution bugs |
| SEC-SUPPLY-03 | Login checked only in middleware (Next.js middleware bypass) |
| SEC-DEPLOY-02 | `.git` folder or `.env` reachable over the web |
| SEC-DEPLOY-04 | Dev server or debug mode exposed |
| SEC-DEPLOY-06 | Preview deployments public and wired to production data |
| SEC-SUPPLY-01 | Known-vulnerable dependencies (`npm audit`) |
| SEC-DEPLOY-01 | Missing security headers (CSP, framing, HSTS, nosniff, Referrer-Policy) |
| SEC-DEPLOY-05 | CORS that trusts every origin with cookies |
| SEC-DEPLOY-07 | API docs, GraphQL introspection or admin tools left public |
| SEC-SUPPLY-04 | Made-up package names (slopsquatting) and typosquats |
| SEC-SUPPLY-05 | Install scripts and npm worms |
| SEC-SUPPLY-06 | Scripts loaded from someone else's server with no integrity check |
| SEC-SUPPLY-07 | GitHub Actions that leak secrets or run untrusted pull requests |
| SEC-SUPPLY-09 | AI coding agent config (hooks, MCP servers, rules files) as an attack path |
| SEC-DEPLOY-03 | Source maps public in production |
| SEC-DEPLOY-08 | Error pages that print stack traces |
| SEC-DEPLOY-09 | Forgotten subdomain pointing at a deleted service |
| SEC-DEPLOY-13 | No backup, or a backup nobody restored |
| SEC-DEPLOY-14 | No logs that would show an attack |
| SEC-SUPPLY-08 | Lockfile not committed |
| SEC-DEPLOY-10 | Old API versions still live |
| SEC-DEPLOY-11 | Plain HTTP still answers |
| SEC-DEPLOY-12 | `robots.txt` listing private paths |

IDs are numbered by topic, not by rank; the table is in rank order.

---

### SEC-SUPPLY-02 · Old Next.js or React with known remote-code-execution bugs
- **Applies when:** `package.json` has `next` (App Router, React Server Components) or `react-server-dom-*`. Hosting on Vercel does not remove the need to update; Vercel only added firewall mitigations ahead of some patches.
- **What goes wrong:** an unauthenticated request runs code on your server, so everything in its environment variables (database, Stripe, AI keys) is stolen. Next.js has had a critical RCE roughly every few months: the table lists the ones that matter for an AI-built app as of 2026-11-16. Vercel's own advice after React2Shell: rotate secrets if you were online and unpatched.

| When | What (vendor wording) | Fixed in |
|---|---|---|
| 2025-12-03 | React2Shell, CVE-2025-55182 / CVE-2025-66478, CVSS 10.0, RCE in React Server Components, App Router, Next 15.x and 16.x (14.x stable, Pages Router not affected) | first patch line: 15.0.5, 15.1.9, 15.2.6, 15.3.6, 15.4.8, 15.5.7, 16.0.7; React 19.0.1 / 19.1.2 / 19.2.1 |
| 2025-12-11 | DoS CVE-2025-55184 / -67779 (High) and source-code exposure CVE-2025-55183 (Medium) in RSC; first DoS fix was incomplete | 14.2.35, 15.0.7, 15.1.11, 15.2.8, 15.3.8, 15.4.10, 15.5.9, 16.0.10 |
| 2026-07-20 | middleware/proxy bypass (CVE-2026-64642), SSRF in rewrites and Server Actions (-64645, -64649), Server Action DoS (-64641), more | 16.2.11, 15.5.21 |
| 2026-08-25 | two Critical RCEs: AVIF image optimisation (libheif via sharp), and Windows-hosted servers (CVE-2026-75604) | 16.3.3, 15.5.24 |
| 2026-09-22 | Critical RCE in Node `ImageResponse` / `next/og` (16.x only; 15.x hardening) | 16.3.6, 15.5.26 |
| 2026-09-30 | SSRF in Image Optimization (CVE-2026-94483, High) plus 5 medium cache bugs and a `next dev` MCP endpoint leak | 16.3.8, 15.5.27 |
| 2026-10-14 | two Critical RCEs (`use cache` typed arrays; Image Optimization with SVG, CVE-2026-96889) and a Server Action DoS | 16.4.1, 15.5.28 |
| 2026-11-03 | cross-tenant cache disclosure (High) and 6 medium (SVG filter bypass, cookie exposure in Edge routes, cache poisoning) | 16.4.5, 15.5.29 |

  The 2026 release posts name only the 16.x and 15.5 lines. Versions 13.x and 14.x are not named in any 2026 post I read: treat them as unpatched and plan a move (they also lack fixes for later issues). Nothing here says 14.x is safe.
- **Find it:** 1. Read `package.json` and the lockfile: `npm ls next react react-dom` (also `react-server-dom-webpack`, `-turbopack`, `-parcel`). 2. Compare against the table; the current lines per nextjs.org/blog are 16.4.x and 15.5.x. 3. Search for features that widen exposure: `images.remotePatterns` and `images.formats` including `avif` in `next.config.*`, `'use cache'` / `cacheComponents`, `ImageResponse` from `next/og`, `rewrites()` with a request-derived host. 4. `npx fix-react2shell-next` (Vercel's own tool, read about in the Next.js advisory) lists the bumps for the 2025 issue.
- **Prove it:** version comparison only. Do not run public exploit code, even on your own app.
- **Fix:** `npm install next@<fixed version for your line> react@<matching patched> react-dom@<same>`, rebuild, run tests, redeploy. If you were online and unpatched during an RCE window, rotate every secret in the project's environment variables (Vercel's advice after React2Shell). Subscribe to the Next.js blog or GitHub advisories. **Who:** Claude bumps and tests; owner rotates keys and redeploys.
- **Severity:** critical, unauthenticated code execution.
- **Source:** https://nextjs.org/blog/CVE-2025-66478 · "All users should upgrade to a patched version immediately." and "There is no workaround—upgrading to a patched version is required." · read 2026-11-16. Latest: https://nextjs.org/blog/november-2026-security-release · "Updates are now available in v16.4.5 (Active LTS) and v15.5.29 (Maintenance LTS)" · read 2026-11-16. React side: https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components · "An unauthenticated attacker could craft a malicious HTTP request to any Server Function endpoint that, when deserialized by React, achieves remote code execution on the server." · read 2026-11-16

### SEC-SUPPLY-03 · Login checked only in middleware (Next.js middleware bypass)
- **Applies when:** auth or role checks live only in `middleware.ts` / `proxy.ts` and server components, route handlers and Server Actions assume the request got through. Self-hosted (`next start`, standalone) was affected by CVE-2025-29927; Vercel-hosted apps were not.
- **What goes wrong:** Next.js uses an internal header to stop middleware recursion; a request carrying it skipped middleware and with it every login check. Vercel's postmortem: "This vulnerability relied on an internal header that was undocumented." The bug class returned in July 2026: a middleware/proxy bypass for apps built with Turbopack and a single entry in `i18n.locales` (CVE-2026-64642, High).
- **Find it:** 1. Open `middleware.ts`/`proxy.ts`: does it decide who may see `/dashboard`, `/admin`, `/api/*`? 2. Open the matching `page.tsx`, `route.ts`, and each `'use server'` function: is there a session check (`supabase.auth.getUser()`) inside? Bad: no. 3. Check hosting and version: fixed in 12.3.5, 13.5.9, 14.2.25, 15.2.3 for the 2025 bug; see SEC-SUPPLY-02 for 2026.
- **Prove it:** with the owner's staging copy, request a protected route with no session and confirm a redirect or 401 from the route itself, not only from middleware.
- **Fix:** check authentication and authorisation in every route handler, Server Action and data-access function (Next.js: Server Actions are "reachable via a direct POST request, not just through your application's UI"); treat middleware as a convenience layer; patch Next.js; if you cannot patch, strip `x-middleware-subrequest` at your proxy. **Who:** Claude.
- **Severity:** critical, login skipped where it applies.
- **Source:** https://vercel.com/blog/postmortem-on-next-js-middleware-bypass · "Next.js uses an internal x-middleware-subrequest header to detect and prevent recursion" · read 2026-11-16. Server Actions: https://nextjs.org/docs/app/guides/data-security · "reachable via a direct POST request, not just through your application's UI" · read 2026-11-16. July 2026 bypass: https://nextjs.org/blog/july-2026-security-release · "any authentication or security checks that a middleware/proxy may perform are bypassed." · read 2026-11-16

### SEC-DEPLOY-02 · `.git` folder or `.env` reachable over the web
- **Applies when:** you deploy by copying the project folder to a server (VPS, shared hosting, S3 website, a `public/` folder that contains dotfiles), or put secret files under `public/`. Vercel and Next.js builds deploy build output, not the repo, so this is rare there.
- **What goes wrong:** `/.git/` hands out the whole code history, including keys deleted long ago. Intruder scanned 3.5 million hosts and found 28,000 exposed repositories; "107 live Stripe secret keys were recovered, a handful of which were still valid."
- **Find it:** 1. Check `public/` for `.git`, `.env*`, `*.sql`, `*.zip`, `backup*`, `*.pem`. 2. Check deploy scripts and Dockerfiles for `COPY . .` with no `.dockerignore` listing `.git` and `.env`. 3. Search git history for secrets: `git log -p -S"sk_live" --all | head` and `git log --all --diff-filter=D --name-only | grep -i env`. 4. `.env` in `.gitignore`? (create-next-app adds it.)
- **Prove it:** `curl -s -o /dev/null -w "%{http_code}\n" https://<site>/.git/HEAD` and the same for `/.env` and `/.env.local`. A 200 with content is a finding.
- **Fix:** deploy built output only; block dotfile paths at the server (nginx `location ~ /\. { deny all; }`); add `.dockerignore`; rotate every key that ever sat in a commit (a key in history is burned even after deletion). **Who:** Claude for config; owner rotates keys.
- **Severity:** critical, hands over the code and its keys.
- **Source:** https://www.intruder.io/research/api-keys-bank-details-disciplinary-files-what-28-000-exposed-git-repos-gave-up · "107 live Stripe secret keys were recovered, a handful of which were still valid." · read 2026-11-16

### SEC-DEPLOY-04 · Dev server or debug mode exposed
- **Applies when:** `next dev`, `vite`, `flask run --debug` or `app.run(debug=True)`, `DEBUG=True` (Django), or Supabase Studio and similar tools run on a reachable address; people share a tunnel (ngrok, Cloudflare Tunnel, `--host 0.0.0.0`) to show a demo.
- **What goes wrong:** Flask's debugger "allows executing arbitrary Python code from the browser". Vite's docs: setting `allowedHosts` to true lets any website send requests to your dev server through DNS rebinding and download your source code and content. Next.js's dev server exposed an MCP endpoint that did not check where requests came from (CVE-2026-94486, Low, fixed 16.3.8 / 15.5.27).
- **Find it:** 1. Search the deploy config and scripts: `"start": "next dev"`, `vite --host`, `server.allowedHosts: true`, `NODE_ENV=development` in production env vars, `debug=True`, `DEBUG = True`, `FLASK_DEBUG`. 2. Look for `_next/webpack-hmr`, `/__nextjs_original-stack-frame`, `/@vite/client` on the live domain. 3. Vercel Project Settings > Environment Variables: `NODE_ENV` should not be set by hand.
- **Prove it:** `curl -I https://<site>/@vite/client` and `https://<site>/_next/webpack-hmr`; a 200 means a dev server is serving.
- **Fix:** production runs `next build` then `next start` (or the Vercel build), never the dev command; keep dev servers on `localhost`; use an explicit `allowedHosts` list; turn debug flags off. **Who:** Claude.
- **Severity:** critical when public, remote code or source theft.
- **Source:** https://flask.palletsprojects.com/en/stable/debugging/ · "Do not run the development server, or enable the built-in debugger, in a production environment." · read 2026-11-16. Vite: https://vite.dev/config/server-options · "allows any website to send requests to your dev server through DNS rebinding attacks, allowing them to download your source code and content" · read 2026-11-16. Next.js: https://nextjs.org/blog/september-2026-security-release · "Only applications run with `next dev` are affected." · read 2026-11-16

### SEC-DEPLOY-06 · Preview deployments public and wired to production data
- **Applies when:** Vercel (or Netlify, Render) creates a URL for every branch or pull request, and its environment variables point at the production database or live Stripe keys. AI tools and Vercel's own v0 create these constantly.
- **What goes wrong:** the preview is a second copy of your app with weaker review and a guessable URL, talking to real data. Anyone who finds it can sign up or read data in the live database.
- **Find it:** 1. Vercel dashboard > Project > Settings > Deployment Protection: see what protects Preview (and Production). 2. Settings > Environment Variables: any variable scoped to "Preview" that holds `service_role`, `sk_live_`, or the production `DATABASE_URL`. 3. `vercel env ls` (CLI) lists scopes by name. 4. List existing deployments: `vercel ls` and open an old one.
- **Prove it:** open a preview URL in a private window; if it loads without a Vercel login, it is public.
- **Fix:** turn on Deployment Protection for previews (Vercel Authentication is the default recommendation); give Preview its own Supabase project and Stripe test keys; delete stale preview deployments; do not put secrets in Preview scope. **Who:** owner (dashboard), Claude can write the checklist.
- **Severity:** high, a second door to live data.
- **Source:** https://vercel.com/docs/deployment-protection · "Deployment Protection lets you control who can access your preview and production URLs." · read 2026-11-16. One audit of two AI-built sites ran them on `*.vercel.app` URLs; that setup has the same shape.

### SEC-SUPPLY-01 · Known-vulnerable dependencies (`npm audit`)
- **Applies when:** every project with a `package.json`.
- **What goes wrong:** old packages carry public advisories with exploit code. The audit only reports; it cannot judge whether the vulnerable function is reachable.
- **Find it:** 1. `npm audit --omit=dev` (runtime dependencies first; dev-only findings rarely reach users). 2. `npm audit --omit=dev --audit-level=high` exits non-zero for high and critical, good for CI. 3. Read each finding: package, "fix available", path (`node_modules/x > y`), severity. 4. Also `npm outdated` and, for pnpm/yarn, `pnpm audit` / `yarn npm audit`. 5. `npm audit` sends the dependency list to the registry: expected, not a leak.
- **Prove it:** the audit output is the proof; for Next.js and React see SEC-SUPPLY-02.
- **Fix:** `npm audit fix` for safe bumps (npm's docs warn some "cannot be fixed automatically"); for a major bump read the changelog and run tests; replace abandoned packages; turn on Dependabot or Renovate security updates (Settings > Code security). Do not use `--force` without review. **Who:** Claude (bumps), owner (enable Dependabot).
- **Severity:** varies, critical for RCE in a runtime package.
- **Source:** https://docs.npmjs.com/cli/v11/commands/npm-audit · "Note that some vulnerabilities cannot be fixed automatically and will require manual intervention or review." · read 2026-11-16

### SEC-DEPLOY-01 · Missing security headers (CSP, framing, HSTS, nosniff, Referrer-Policy)
- **Applies when:** every public site. In one audit of two AI-built restaurant sites, both lacked anti-framing headers (low severity).
- **What goes wrong:** without `frame-ancestors`/`X-Frame-Options`, another site can load yours invisibly and trick a click (clickjacking). Without a Content-Security-Policy an XSS bug has no second layer. Without `nosniff` a browser may run an uploaded file as HTML. Without HSTS a first visit over HTTP can be intercepted.
- **Find it:** 1. `curl -sI https://<site>/` and read the response headers. Want: `content-security-policy` (with `frame-ancestors 'none'` or `'self'`), `x-frame-options: DENY`, `strict-transport-security: max-age=63072000; includeSubDomains`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`. 2. In code: `next.config.*` `async headers()`, `middleware.ts`/`proxy.ts` `response.headers.set`, `vercel.json` `headers`. 3. Static host with none of these = missing.
- **Prove it:** the `curl -sI` output, plus `<iframe src="https://<site>">` in a local scratch HTML file: if the page renders inside, it can be framed.
- **Fix:** add a `headers()` block in `next.config.js` for `source: '/(.*)'` with the set above. CSP in Next.js needs nonces for inline scripts (`script-src 'self' 'nonce-...'`) and dynamic rendering; start with `Content-Security-Policy-Report-Only`, fix what it reports, then enforce. Do not copy `'unsafe-inline'`/`'unsafe-eval'` into production unless a tool forces it (Next.js dev needs `'unsafe-eval'`, production does not). **Who:** Claude.
- **Severity:** low alone, medium with an XSS bug nearby.
- **Source:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options · "Sites can use this to avoid clickjacking attacks" · read 2026-11-16. CSP: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy · "guard against cross-site scripting attacks" · read 2026-11-16. HSTS: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security · "informs browsers that the host should only be accessed using HTTPS" · read 2026-11-16. Nonces: https://nextjs.org/docs/app/guides/content-security-policy · "the nonce must be unpredictable and unique for every request" · read 2026-11-16

### SEC-DEPLOY-05 · CORS that trusts every origin with cookies
- **Applies when:** you set `Access-Control-Allow-Origin` yourself on API routes, Edge Functions or a separate backend (`cors()` middleware, `headers()` in `next.config`, `corsHeaders` in Supabase Edge Functions).
- **What goes wrong:** a header that echoes whatever `Origin` the request sends, combined with `Access-Control-Allow-Credentials: true`, lets any website the user visits call your API as that user and read the answer. A literal `*` cannot be combined with credentials (browsers refuse), but `*` still exposes any non-cookie secret in the response and signals sloppy config. Many AI-written snippets copy `req.headers.origin` back.
- **Find it:** 1. Search `Access-Control-Allow-Origin`, `cors(`, `origin: true`, `origin: '*'`, `corsHeaders`, `Allow-Credentials`. 2. Bad: value built from the request's `Origin` with no allow-list check.
- **Prove it:** `curl -s -I -H "Origin: https://evil.example" https://<site>/api/<route>`; if `access-control-allow-origin: https://evil.example` comes back (especially with `access-control-allow-credentials: true`), it reflects.
- **Fix:** keep an array of your own origins and echo the origin only if it is in the array, add `Vary: Origin`; leave CORS off for routes only your own site calls (same-origin needs none). For Supabase Edge Functions that really are called from other sites, list the exact origins. **Who:** Claude.
- **Severity:** high with credentials, low without.
- **Source:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS · "the server must specify an origin in the value of the Access-Control-Allow-Origin header, instead of specifying the * wildcard" · read 2026-11-16

### SEC-DEPLOY-07 · API docs, GraphQL introspection or admin tools left public
- **Applies when:** `/docs`, `/swagger`, `/openapi.json`, `/redoc` (FastAPI defaults), `/graphql` or `/api/graphql` with GraphiQL, phpMyAdmin, Adminer, Supabase Studio self-hosted, `/admin`, `/debug`, Prisma Studio, Drizzle Studio.
- **What goes wrong:** attackers read your whole API map, including private fields, or use an admin page that relies on being unlinked. In one audit of two AI-built sites, admin pages correctly refused non-admins; that is the bar.
- **Find it:** 1. Search `swagger`, `openapi`, `graphiql`, `introspection`, `playground`, `adminer`, `studio`. 2. Search `app/**/admin`, `app/**/debug` for session checks. 3. Bad: introspection on in production (Apollo `introspection: true`, Yoga default), FastAPI built with defaults (`docs_url`).
- **Prove it:** request `https://<site>/docs`, `/openapi.json`, `/graphql`, `/admin`, `/debug` and `/api/debug`; for GraphQL POST `{"query":"{__schema{types{name}}}"}` to your own endpoint.
- **Fix:** turn docs and introspection off in production (`docs_url=None`, `introspection: false`), or put them behind login; protect every admin route with a server-side role check; do not expose database tools on the internet (VPN or localhost). **Who:** Claude.
- **Severity:** medium for docs, critical for an open admin or database tool.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html · "Often comes by default with introspection and/or GraphiQL enabled and not requiring authentication" · read 2026-11-16

### SEC-SUPPLY-04 · Made-up package names (slopsquatting) and typosquats
- **Applies when:** an AI assistant suggested or added a dependency you did not choose, especially a small, new or oddly named one.
- **What goes wrong:** AI models invent package names that do not exist; an attacker registers the name with malware and waits for the next person to run the AI's `npm install`. A USENIX Security 2025 study of 576,000 code samples found "205,474 unique examples of hallucinated package names" and an average of "at least 5.2% for commercial models and 21.7% for open-source models". A 2026 vendor number for newer models is lower but not zero (Socket, not primary: do not quote it).
- **Find it:** 1. List dependencies added since the first commit: `git log -p --follow package.json` or diff `package.json`. 2. For each unfamiliar one: `npm view <pkg> time.created maintainers repository weekly downloads` (or the npm page): created in the last weeks, one maintainer, no repo, a few downloads is suspicious. 3. Check the spelling against the real library (`reqeusts`, `colourama`, `react-dom-router`). 4. Read its `package.json` scripts for install hooks.
- **Prove it:** the registry metadata above.
- **Fix:** remove packages you cannot justify, replace with the well-known package, pin versions, ask the AI to name the official docs for any library before installing, and enable your registry's malware scanning (Socket, Snyk, GitHub Dependabot malware alerts) where offered. **Who:** both.
- **Severity:** high, code runs on install.
- **Source:** https://www.usenix.org/conference/usenixsecurity25/presentation/spracklen · "the average percentage of hallucinated packages is at least 5.2% for commercial models and 21.7% for open-source models" · read 2026-11-16

### SEC-SUPPLY-05 · Install scripts and npm worms
- **Applies when:** you install npm packages (all JavaScript apps), or run `npm install` in CI with publish tokens present. npm 12 (July 2026) blocks dependency install scripts by default; older npm, pnpm settings and Yarn classic may not.
- **What goes wrong:** a package's `preinstall` / `install` / `postinstall` script runs the moment you install it. The Shai-Hulud worm (2025, repeated in 2026) used it to steal tokens and publish itself into the victim's other packages. CISA: the malware "scanned the environment for sensitive credentials" and spread by "authenticating to the npm registry as the compromised developer".
- **Find it:** 1. `npm -v`: below 11.16 has no warnings, 11.16+ warns, 12+ blocks. 2. `grep -rn "\"postinstall\"\|\"preinstall\"" node_modules/*/package.json | head` lists packages with hooks. 3. Look in `package.json` for an `allowScripts` block (npm 12) and `.npmrc` for `ignore-scripts`. 4. Check whether CI and your laptop hold `NPM_TOKEN` or cloud keys during `npm install`. 5. Look for dependencies installed from a git URL or tarball (`github:`, `git+https`).
- **Prove it:** the listing above.
- **Fix:** upgrade to npm 12 and run `npm approve-scripts --allow-scripts-pending`, approve only packages that truly need a build, commit the result; otherwise `npm config set ignore-scripts true`; install in CI with `npm ci`; keep publish tokens out of install steps; use phishing-resistant 2FA on npm and GitHub; wait a few days before adopting brand-new versions of popular packages; after any known compromise, rotate every credential that was on that machine. **Who:** both (accounts and 2FA: owner).
- **Severity:** high, steals every key on the machine.
- **Source:** https://github.blog/changelog/2026-06-09-upcoming-breaking-changes-for-npm-v12/ · "`npm install` will no longer execute `preinstall`, `install`, or `postinstall` scripts from dependencies" · read 2026-11-16. Worm: https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem · "Immediately rotate all developer credentials." · read 2026-11-16. The GitHub page says these defaults apply from npm 12 and that 11.16+ shows warnings; the July 2026 general-availability date came from secondary sources, so check `npm -v` rather than assuming.

### SEC-SUPPLY-06 · Scripts loaded from someone else's server with no integrity check
- **Applies when:** `<script src="https://...">` or `next/script` pointing at a CDN or third party: analytics, chat widgets, polyfills, fonts, tag managers, ad pixels. Also an old script URL on a domain that has since expired or changed hands.
- **What goes wrong:** whoever controls that domain controls your pages. Sansec: the domain "was caught injecting malware on mobile devices via any site that embeds cdn.polyfill.io", on 100,000+ sites (June 2024). Third-party scripts also see every keystroke on your forms; the legal files cover tracker consent.
- **Find it:** 1. Search `<script`, `src="http`, `next/script`, `strategy=`, `_document`, `layout.tsx`, `@import url(http`, `<link rel="stylesheet" href="http`. 2. For each external host: is it still the vendor's domain? `whois` / the vendor docs. 3. Bad: no `integrity="sha384-..." crossorigin="anonymous"`, or a `latest`/unversioned URL. 4. Check the browser Network tab for hosts you did not add.
- **Prove it:** the host list from step 4.
- **Fix:** remove what you do not need (polyfill.io is not needed; browsers support the features); self-host the file from `public/` or npm; for a CDN file, pin an exact version and add `integrity` and `crossorigin`; add a CSP `script-src` allow-list so unknown hosts cannot run. SRI cannot pin a script that changes by design (analytics tags): accept that risk knowingly or self-host a proxy. **Who:** Claude.
- **Severity:** high, a third party's compromise becomes yours.
- **Source:** https://sansec.io/research/polyfill-supply-chain-attack · "this domain was caught injecting malware on mobile devices via any site that embeds cdn.polyfill.io." · read 2026-11-16. SRI: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity · "Subresource Integrity (SRI) is a security feature that enables browsers to verify that resources" · read 2026-11-16

### SEC-SUPPLY-07 · GitHub Actions that leak secrets or run untrusted pull requests
- **Applies when:** `.github/workflows/*.yml` exists, especially in a public repo, or AI added a CI file.
- **What goes wrong:** a workflow triggered by a stranger's pull request runs with your secrets; or an expression like `${{ github.event.pull_request.title }}` placed inside a `run:` line lets the PR author inject shell commands. GitHub's docs: `pull_request_target` and `workflow_run` "when used with the checkout of an untrusted pull request, expose the repository to security compromises."
- **Find it:** 1. Open each workflow. 2. Search `pull_request_target`, `workflow_run`, `issue_comment`, and `actions/checkout` with `ref: ${{ github.event.pull_request.head` (checking out the PR code under a privileged trigger). 3. Search `run:` blocks containing `${{ github.event.`, `github.head_ref`, `issue.title`, `comment.body`. 4. Look for `permissions:` (missing means broad defaults on older repos) and secrets passed to steps that do not need them. 5. `uses: owner/action@v1` (a movable tag) instead of a commit SHA. 6. Secrets printed with `echo`, or `set -x`.
- **Prove it:** code only.
- **Fix:** use `pull_request` for untrusted code; set `permissions: contents: read` at the top; pass context values through `env:` and quote them in shell; pin third-party actions to a full commit SHA; use environments with required reviewers for deploy secrets; restrict who can run workflows on forks. **Who:** Claude edits files; owner sets repo settings and approvals.
- **Severity:** high, secrets and write access leak.
- **Source:** https://docs.github.com/en/actions/reference/security/secure-use · "Avoid using the pull_request_target workflow trigger if it's not necessary." · read 2026-11-16. Pinning: same page · "Pin actions to a full-length commit SHA" · read 2026-11-16

### SEC-SUPPLY-09 · AI coding agent config (hooks, MCP servers, rules files) as an attack path
- **Applies when:** you or a teammate open a repo you did not write in Claude Code, Cursor, Copilot or another agent; or you accept pull requests that touch `.claude/`, `.cursor/`, `.mcp.json`, `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`; or your agent has MCP servers connected to your database, GitHub or Vercel.
- **What goes wrong:** those files are code. A hook is a shell command that runs on an event; an MCP server is a program the agent starts. Check Point Research showed a hook in a repo's project settings could run commands, a project MCP config could start a server without approval, and an environment setting could redirect API traffic and capture the API key (CVE-2025-59536, CVE-2026-21852); Anthropic patched them. Rules files can also hide instructions that steer an agent ("prompt injection"). Separately, an agent with a database or cloud MCP and broad rights can be talked into destructive actions by text it reads.
- **Find it:** 1. List agent config: `ls .claude .cursor .vscode .mcp.json AGENTS.md CLAUDE.md .github/copilot-instructions.md`. 2. In `.claude/settings.json` read every `hooks` entry (`command`), `env` (look for `ANTHROPIC_BASE_URL` or any proxy URL), and `enableAllProjectMcpServers`. 3. In `.mcp.json` read each server's `command` and `url`. 4. Read rules files for hidden text (long zero-width or off-screen content: `grep -nP '[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}]'`). 5. Check which MCP servers have write or admin rights (Supabase MCP pointed at production, Vercel MCP with deploy rights).
- **Prove it:** the reading above; if a hook or server does something you cannot explain, stop and ask the owner.
- **Fix:** review changes to these paths like code, require owner review in CODEOWNERS; keep the Claude Code version current (the issues above were fixed); give MCP servers read-only or development-only credentials and keep production for people; keep sandboxing and the permission prompts on; do not run agents with approvals off on code you did not write; never put secrets in rules files. **Who:** both.
- **Severity:** high, runs commands on the developer's machine.
- **Source:** https://research.checkpoint.com/2026/rce-and-api-token-exfiltration-through-claude-code-project-files-cve-2025-59536/ · "Hooks are designed to provide deterministic control over Claude Code's behavior by executing user-defined commands at various points in the tool's lifecycle." · read 2026-11-16. Vendor docs: https://code.claude.com/docs/en/security · "Trust verification: In an interactive session, Claude Code shows the workspace trust dialog when you start it in a folder you haven't trusted." · read 2026-11-16

### SEC-DEPLOY-03 · Source maps public in production
- **Applies when:** `productionBrowserSourceMaps: true` in `next.config.*`, Vite `build.sourcemap: true`, CRA `GENERATE_SOURCEMAP` unset, or a `.map` file inside a published npm package.
- **What goes wrong:** anyone can rebuild your original source, find hidden routes, and hunt for secrets in comments. The Claude Code npm package shipped a source map (reported by The Hacker News, ~2,000 files); Anthropic called it a packaging mistake. Source is not the same as secrets: a secret in the client bundle is exposed with or without a map.
- **Find it:** 1. Search `productionBrowserSourceMaps`, `sourcemap: true`, `sourceMap`. 2. `npm run build` then `ls .next/static/chunks/*.map` (Next.js does not emit them unless enabled). 3. For a package: `npm pack --dry-run` and read the file list.
- **Prove it:** open a live chunk URL from the page source, e.g. `/_next/static/chunks/<name>.js`, and request the same URL plus `.map`; a 200 JSON body is a public map.
- **Fix:** remove the flag; if you need maps for error tracking, upload them to Sentry and do not serve them; use `files` or `.npmignore` for packages; on Vercel, Deployment Protection can protect source maps while the site stays public. **Who:** Claude.
- **Severity:** low to medium, makes other attacks easier.
- **Source:** https://nextjs.org/docs/app/api-reference/config/next-config-js/productionBrowserSourceMaps · "During production builds, they are disabled to prevent you leaking your source on the client, unless you specifically opt-in" · read 2026-11-16

### SEC-DEPLOY-08 · Error pages that print stack traces
- **Applies when:** custom API routes return `err.message` or `err.stack` in JSON; Express default error handler in non-production mode; Django/Flask debug on; Supabase or Postgres errors passed straight to the user.
- **What goes wrong:** the message reveals file paths, table names, library versions and sometimes query text: a free map for the next attack. In one audit of two AI-built sites, a second finding on login (the login page shows any message a link tells it to) is a cousin: the page prints text it did not write.
- **Find it:** 1. Search `res.status(500).json({ error: err`, `err.stack`, `error.message` in responses, `catch (e) { return NextResponse.json(e` , `JSON.stringify(error)`. 2. Check `NODE_ENV` in production is `production`. 3. Next.js App Router production builds replace server error messages with a generic message and a digest; custom handlers can undo that.
- **Prove it:** trigger a harmless error on your own site (a malformed JSON body to your API, an unknown id) and read the response body.
- **Fix:** return a short generic message and a request id; log the details server-side (Vercel runtime logs, Sentry); never forward database errors to the client. **Who:** Claude.
- **Severity:** low, information leak.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html · "generic response is returned by the application but the error details are logged server side for investigation, and not returned to the user" · read 2026-11-16

### SEC-DEPLOY-09 · Forgotten subdomain pointing at a deleted service
- **Applies when:** you have a custom domain and have ever added a DNS record (CNAME, A, NS) for a Vercel project, Netlify site, Heroku app, GitHub Pages, S3 bucket, Azure or other service you later deleted.
- **What goes wrong:** someone claims the deleted service's name and now serves their page on `blog.yourdomain.com`, with your cookies in scope if they were set on the parent domain. OWASP: remove the record before removing the resource.
- **Find it:** 1. List DNS records in your registrar or Vercel Domains (`vercel dns ls <domain>`). 2. For each CNAME, request the host: `curl -sI https://sub.example.com`; "404 not found", "no such app" or a provider error page is the fingerprint. 3. `dig CNAME sub.example.com +short` and check the target still exists in your account. 4. Check cookie scope: session cookies on `.example.com` raise the damage.
- **Prove it:** step 2 and 3 on your own subdomains.
- **Fix:** delete the DNS record, then recreate it only when the service exists; keep a list of which DNS name belongs to which project; scope session cookies to the exact host (`__Host-` prefix). **Who:** owner (DNS access), Claude lists records.
- **Severity:** medium to high, you serve an attacker's page under your name.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Subdomain_Takeover_Prevention_Cheat_Sheet.html · "Remove the DNS record immediately. This is the fastest mitigation." · read 2026-11-16

### SEC-DEPLOY-13 · No backup, or a backup nobody restored
- **Applies when:** any app with data you cannot recreate. Supabase free-plan projects have no downloadable daily backups; paid plans keep 7, 14 or 30 days. (GitLab's 2017 incident, five backup mechanisms that all failed unnoticed).
- **What goes wrong:** one bad migration, a deleted project or a ransom wipes production with no way back. A backup is only a backup after a successful restore.
- **Find it:** 1. Supabase dashboard > Database > Backups: which plan, how many days, Point-in-Time Recovery on or off. 2. Search the repo and CI for `pg_dump`, `supabase db dump`, scheduled workflows. 3. Ask the owner: has a restore ever been tried?
- **Prove it:** restore the latest backup into a scratch Supabase project (or local Postgres) and check real rows come back; time it.
- **Fix:** paid plan with daily backups, add Point-in-Time Recovery if data changes minute to minute; for any plan run a scheduled `supabase db dump` to storage you control; write the restore steps in `docs/`; protect production with a separate admin login and a confirmation step for destructive SQL. **Who:** owner (plan, storage), Claude (scripts, runbook).
- **Severity:** high, one mistake ends the business.
- **Source:** https://supabase.com/docs/guides/platform/backups · "We recommend that free tier plan projects regularly export their data using the Supabase CLI db dump command and maintain off-site backups." · read 2026-11-16

### SEC-DEPLOY-14 · No logs that would show an attack
- **Applies when:** every live app. Vercel runtime logs on the Hobby plan keep 1 hour, on Pro 1 day, unless Observability Plus (30 days).
- **What goes wrong:** an attack at night is gone by morning, so you cannot tell what was taken, or whether it happened. Break-in notification duties in privacy law start from knowing (see the legal files).
- **Find it:** 1. Vercel > Logs: the retention line for your plan. 2. Search the code for any logging of failed logins, permission denials, rate-limit hits, webhook signature failures. 3. Supabase > Logs (Auth, Postgres, Edge) retention. 4. Is any alert wired (Sentry, email on spikes of 401/403/429/500)? 5. Are secrets or personal data written to logs (`console.log(user)`)?
- **Prove it:** cause one failed login on a test account and find it in the logs.
- **Fix:** log security events (login failures, access denied, signup bursts, 429s, signature failures) with user id and request id but no passwords, tokens or full card data; add a log drain (Vercel Drains) or Sentry; set alerts; extend retention. **Who:** Claude (code), owner (plan, alert address).
- **Severity:** medium, speeds recovery and proof.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html · "Application logging should always be included for security events" · read 2026-11-16. Retention: https://vercel.com/docs/logs/runtime · "1 hour of logs" (Hobby row of the retention table) · read 2026-11-16

### SEC-SUPPLY-08 · Lockfile not committed
- **Applies when:** `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` or `bun.lock` is missing from git (check `.gitignore`).
- **What goes wrong:** every install re-resolves versions, so a freshly published malicious or broken release can land in production without a code change.
- **Find it:** 1. `git ls-files | grep -E "package-lock|pnpm-lock|yarn.lock|bun.lock"`. 2. `.gitignore` containing a lockfile. 3. CI or Vercel using `npm install` instead of `npm ci`.
- **Prove it:** the `git ls-files` output.
- **Fix:** commit the lockfile; use `npm ci` in CI (fails if the lockfile and `package.json` disagree); review lockfile diffs in pull requests. **Who:** Claude.
- **Severity:** medium, silent version drift.
- **Source:** https://docs.npmjs.com/cli/v11/commands/npm-ci · "The project must have an existing package-lock.json or npm-shrinkwrap.json." · read 2026-11-16

### SEC-DEPLOY-10 · Old API versions still live
- **Applies when:** you ship `/api/v1` and `/api/v2`, old Supabase Edge Functions, or old route handlers kept "just in case"; or older deployments still answer on their own URLs (Vercel keeps every deployment reachable by its unique URL).
- **What goes wrong:** the old route misses the fix you added to the new one (rate limit, auth check, price check), so attackers use it. A pattern seen in one audit of two AI-built sites: a hole is closed in one path and open in another.
- **Find it:** 1. `find app -path "*api*" -name route.ts` and list every route; look for `v1`, `legacy`, `old`, `test`, `tmp`. 2. Supabase: list Edge Functions (`supabase functions list`) and old RPC functions in `public`. 3. Vercel: `vercel ls`; open an old production deployment URL.
- **Prove it:** call the old route with a request the new one rejects (no auth, a bad price).
- **Fix:** delete unused routes and functions; redirect or return 410; apply shared middleware (auth, validation, rate limit) to every route; remove old deployments from the dashboard when they hold secrets or old code. **Who:** Claude.
- **Severity:** medium, bypass of fixes.
- **Source:** UNVERIFIED as a class. I found no vendor or OWASP page to quote in this pass (tried OWASP API Security Top 10 "Improper Inventory Management"; not opened today). The Vercel behaviour is from https://vercel.com/docs/deployment-protection · "Deployment Protection lets you control who can access your preview and production URLs." · read 2026-11-16

### SEC-DEPLOY-11 · Plain HTTP still answers
- **Applies when:** your own server, nginx, a VPS or a custom domain on a host that does not redirect. Vercel redirects HTTP to HTTPS and the setting cannot be turned off.
- **What goes wrong:** login cookies and passwords can be read on public Wi-Fi if any page loads over HTTP, and browsers will not remember to use HTTPS without HSTS.
- **Find it:** 1. `curl -sI http://<site>/` should return a 301 or 308 to `https://`. 2. `curl -sI https://<site>/ | grep -i strict-transport` for HSTS. 3. Search code and config for `http://` URLs for your own assets, API or auth callbacks. 4. Cookies set without `Secure`.
- **Prove it:** the two `curl` lines.
- **Fix:** redirect all HTTP to HTTPS, send HSTS (see SEC-DEPLOY-01), mark cookies `Secure; HttpOnly; SameSite=Lax`, use `https://` in Supabase Site URL and redirect lists. **Who:** Claude (config), owner (host panel).
- **Severity:** medium, traffic readable on hostile networks.
- **Source:** https://vercel.com/docs/security/reverse-proxy · "Vercel's automatic HTTP-to-HTTPS redirect can't be disabled" · read 2026-11-16

### SEC-DEPLOY-12 · `robots.txt` listing private paths
- **Applies when:** `public/robots.txt` or `app/robots.ts` has `Disallow: /admin`, `/internal`, `/private-reports`. AI-built sites often do this to "hide" pages.
- **What goes wrong:** `robots.txt` is public and only a polite request to well-behaved crawlers; it advertises exactly where the sensitive pages are. OWASP's testing guide says sensitive paths listed there "remain discoverable by any crawler that ignores the protocol."
- **Find it:** 1. Open `https://<site>/robots.txt` and `/sitemap.xml`. 2. For every `Disallow` path ask: does that page require login on the server (SEC-DEPLOY-07)?
- **Prove it:** open each listed path in a private window.
- **Fix:** protect the path with real authentication; keep `robots.txt` for crawl-budget hints only; add `noindex` meta or header for pages that must not appear in search; do not list secret URLs anywhere public. **Who:** Claude.
- **Severity:** low, only a signpost.
- **Source:** https://wstg.owasp.org/latest/4-Web_Application_Security_Testing/01-Information_Gathering/03-Review_Webserver_Metafiles_for_Information_Leakage/ · "sensitive paths listed in robots.txt remain discoverable by any crawler that ignores the protocol" · read 2026-11-16

## Not covered here
- Secrets in the repo or bundle (`.env` committed, `NEXT_PUBLIC_` keys), auth, RLS, payments, rate limits: other reference files. Only the web-reachable `.git`/`.env` file case is here.
- Expired-domain registration (your own domain lapsing): not researched; add to the owner checklist ("auto-renew the domain, set a calendar reminder").
- HTTP/2 Rapid Reset (CVE-2023-44487) and other self-hosted web-server bugs: only matters for your own nginx or Node server; patch the server, and a CDN absorbs it. Not re-opened today.
- Container, Kubernetes and cloud-account hardening: out of scope for the usual stack.
- Python, Ruby and PHP framework advisories: this file leads with Next.js, React and npm.

## Open questions
- Next.js 13.x and 14.x: no 2026 release post I read names them. I could not find the vendor statement of their support status; confirm at https://nextjs.org/support-policy before telling an owner "you are unpatched". The CVE-2025-29927 posts show 14.2.25 and 13.5.9 as backports in 2025.
- The React-side fixed versions after React2Shell (later advisories GHSA-xqc2-xf4c-x3h3, GHSA-h3gv-c5rc-p453, Oct 2026) were not opened; the skill should tell Claude to read the current React blog for the fixed `react` version rather than hard-code one.
- The November 3 post prints `npm install next@16.4.5   # for 16.5`; likely a typo for the 16.4 line.
- SEC-SUPPLY-05: npm 12's exact release date (reported as 8 July 2026 by secondary sources) and exact allow-list command names were read from GitHub's changelog preview and not from npm's v12 docs.
- SEC-DEPLOY-10: no primary source quoted.
- The Check Point write-up covers 2025 versions of Claude Code; I did not independently confirm the fixed version numbers (secondary sources say 1.0.111 and 2.0.65).
- Vercel HSTS: I did not confirm whether `*.vercel.app` and custom domains send `Strict-Transport-Security` by default; the skill should read it from the live `curl -sI` instead.
