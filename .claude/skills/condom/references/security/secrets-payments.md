# Security: keys and money (SECRET, PAY)

Scope: API keys and other secrets (in the browser, in git, in logs, in the built JavaScript), and everything that touches payments (price, order state, webhooks, coupons, card testing, refunds). Stack order: Next.js, Supabase, Stripe, Vercel. Every entry was checked against the vendor's or OWASP's own page on 2026-11-16. Rotating a key is always the owner's job: Claude finds, explains and changes code, then hands the owner the rotation steps in SEC-SECRET-08. Where a Stripe claim appears, the source is docs.stripe.com or support.stripe.com.

| ID | Plain name |
|---|---|
| SEC-PAY-01 | Price or total trusted from the browser |
| SEC-SECRET-01 | Real key shipped to the browser (`NEXT_PUBLIC_`, `VITE_`, client components) |
| SEC-SECRET-02 | Supabase service-role or Stripe secret key in client code |
| SEC-PAY-02 | Order marked paid without a verified payment (success page, no webhook) |
| SEC-PAY-03 | Stripe webhook with no signature check |
| SEC-SECRET-03 | Keys committed to git or sitting in git history |
| SEC-PAY-04 | Replayed or duplicated webhooks (no idempotency) |
| SEC-PAY-05 | Test keys or test mode in production |
| SEC-SECRET-05 | Old Google API key that now reaches Gemini |
| SEC-PAY-06 | Coupon, credit and balance abuse, double spend (race condition) |
| SEC-SECRET-04 | `.git` folder or `.env` file served by the live site |
| SEC-PAY-07 | Card testing on an open checkout |
| SEC-SECRET-06 | Source maps in production |
| SEC-SECRET-07 | Secrets printed in logs or error pages |
| SEC-PAY-08 | Stripe key with more power than the app needs (restricted keys) |
| SEC-PAY-09 | Refunds and disputes: the numbers that get an account reviewed |
| SEC-SECRET-08 | How to rotate each kind of key (owner's checklist) |

---

### SEC-PAY-01 · Price or total trusted from the browser (client-controlled amount)
- **Applies when:** any checkout, order, booking or top-up where the browser sends `price`, `amount`, `total`, `unit_amount` or `quantity`, or where a database policy lets the browser insert an order row.
- **What goes wrong:** a customer edits the request and pays $0.00 or $1. Real case from one audit of two AI-built restaurant sites: "A $0.00 order for 50 briskets was created and the site marked it PAID." The server code priced from the menu, but a Supabase insert policy (`orders_insert_own_pending`) let any logged-in customer write an order row with its own `total_cents`. It ran in test checkout, so no real money moved.
- **Find it:** 1. Search `rg -n "unit_amount|amount:|price_data|total_cents|total:|quantity" app src pages` and read what feeds each value. A bad result: it comes from `req.json()`, `formData`, a hidden input or a client store. 2. Open `supabase/migrations/*.sql` and `schema.sql`; `rg -n "for insert|FOR INSERT" -A4`. A bad result: a customer-facing insert policy on `orders`, `order_items`, `bookings`, `credits` or `payments` whose `with check` only tests `auth.uid()`. 3. Check the client calls `supabase.from('orders').insert(` directly.
- **Prove it:** in test mode on the owner's own app with a second test account: send the checkout request with `price` or `total` changed to 0 (browser devtools, or `curl` with that account's session) and see whether an order row or Checkout Session is created at that amount. For the policy: run the same insert with the project's anon key and a test user JWT.
- **Fix:** the browser sends only a product id and quantity (validate both with a schema, quantity as a bounded positive integer). The server looks the price up in the database or a Stripe Price id and creates the Checkout Session or PaymentIntent. Drop customer insert/update policies on order and payment tables; create orders through a server action or a `security definer` function that sets the price. Never let a client-writable column hold `status`, `paid`, `total`. **Who:** Claude
- **Severity:** critical, free goods or services
- **Source:** https://docs.stripe.com/payments/advanced/dynamically-update-amounts · "Recalculate amounts on your server. Don’t trust client-provided prices or totals." · read 2026-11-16

### SEC-SECRET-01 · Real key shipped to the browser (public environment variable)
- **Applies when:** Next.js (`NEXT_PUBLIC_*`), Vite (`VITE_*`), Expo (`EXPO_PUBLIC_*`), or any key used inside a `'use client'` file or imported by one.
- **What goes wrong:** the build copies the value into the JavaScript every visitor downloads. Anyone reads it in devtools.
- **Find it:** 1. `rg -n "NEXT_PUBLIC_|VITE_|EXPO_PUBLIC_" --glob "!node_modules" --glob "!.next"` and list every name. A bad name contains `SECRET`, `SERVICE`, `PRIVATE`, `TOKEN`, `OPENAI`, `ANTHROPIC`, `STRIPE_SECRET`, `RESEND`, `TWILIO`, `DATABASE_URL`. 2. Check `.env*`, `.env.example` and Vercel's Environment Variables page for the same names. 3. Search for key shapes in source and the build: `rg -n "sk_live|sk_test|rk_live|whsec_|sb_secret_|service_role|sk-ant-|sk-proj-|AIza[0-9A-Za-z_-]{35}" -g "!node_modules"`; then `rg -l "sk_live|service_role|sk-ant-" .next/static` after `next build`. 4. `rg -ln "'use client'"` then check those files and their imports for `process.env.<non-public name>` and for server SDKs (`stripe`, `openai`, `@anthropic-ai/sdk`) imported client-side.
- **Prove it:** code only. Do not print the value; report the variable name and file.
- **Fix:** remove the prefix, move the call to a Route Handler, Server Action or Supabase Edge Function, and read the key there. Public-by-design values stay public: Stripe publishable key, Supabase URL and publishable/anon key (safe only with row-level security on). Rotate any real key that was exposed (SEC-SECRET-08). **Who:** both (Claude moves the code, owner rotates)
- **Severity:** critical, key is public and readable
- **Source:** https://nextjs.org/docs/app/guides/environment-variables · "It will be inlined into any JavaScript sent to the browser." · read 2026-11-16. Vite: https://vite.dev/guide/env-and-mode · "VITE_* variables should not contain sensitive information such as API keys." · read 2026-11-16

### SEC-SECRET-02 · Supabase service-role or Stripe secret key in client code
- **Applies when:** Supabase (`service_role` JWT or `sb_secret_...`) or Stripe (`sk_live_`, `sk_test_`, `rk_live_`) key appears anywhere the browser, a mobile app or a public repo can reach.
- **What goes wrong:** the Supabase secret key skips every row-level-security policy, so the whole database is readable and writable. A Stripe secret key can create charges, refunds and payouts. Supabase: "A leaked secret key exposes all of your project's data."
- **Find it:** 1. Run the SEC-SECRET-01 step 3 search. 2. `rg -n "createClient\(" -A3` and confirm the key argument in any file reachable from the browser is the publishable/anon key. A bad result: `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` read in a client component, a `lib/` file imported by one, or a `NEXT_PUBLIC_` variable. 3. Check the service client lives in a server-only file (add `import 'server-only'`).
- **Prove it:** code only; never call the API with the leaked key.
- **Fix:** keep the secret in server-only env (no prefix, `import 'server-only'` in the file that reads it). Use the user's own session client for normal reads. Rotate per SEC-SECRET-08. **Who:** both
- **Severity:** critical, bypasses all database rules
- **Source:** https://supabase.com/docs/guides/getting-started/api-keys · "A secret key bypasses every Row Level Security policy you have. Never put one in a browser, a shipped application, or source control." · read 2026-11-16

### SEC-PAY-02 · Order marked paid without a verified payment (success page, no webhook)
- **Applies when:** Stripe Checkout or PaymentIntents, and the app grants access, ships, or sets `paid=true` from the `success_url` page, a client callback, or a client-writable column.
- **What goes wrong:** anyone can open `/success?session_id=...` or call the callback, so access is free. It also fails the other way: paying customers who close the tab never get fulfilled.
- **Find it:** 1. `rg -n "success_url|cancel_url|checkout.session.completed|payment_intent.succeeded|payment_status" app src pages`. 2. Open the success page and any route it calls. A bad result: it sets `paid`, `plan`, `credits` or `is_premium` itself, or trusts a query parameter. 3. Confirm a webhook route exists and is the only code that sets those fields.
- **Prove it:** in test mode, open the success URL for a session that was never paid (or edit the id) and see whether access is granted.
- **Fix:** fulfil only from the webhook (`checkout.session.completed`, and `checkout.session.async_payment_succeeded` for delayed methods), after checking `payment_status`. The success page may only show a message and read state the webhook wrote. Make `paid`, `plan`, `credits` writable by the service role only (revoke update from `authenticated`). **Who:** Claude
- **Severity:** critical, paid features for free
- **Source:** https://docs.stripe.com/checkout/fulfillment · "You can’t rely on triggering fulfillment only from your checkout landing page, because it’s not guaranteed customers visit that page." · read 2026-11-16

### SEC-PAY-03 · Stripe webhook with no signature check (forged payment events)
- **Applies when:** any route receiving Stripe events, usually `app/api/webhooks/stripe/route.ts` or `pages/api/stripe-webhook.ts`.
- **What goes wrong:** the endpoint is a public URL. A forged `checkout.session.completed` unlocks premium for free.
- **Find it:** 1. `rg -n "webhook" -i app src pages supabase/functions`. 2. Open the handler. A bad result: it does `JSON.parse(body)` or `await req.json()` and acts on the event, with no `stripe.webhooks.constructEvent(` (or `constructEventAsync`) call, or the secret is hard-coded or empty-string fallback. 3. Check it reads the raw body (`await req.text()`), because "Stripe requires the raw body of the request to perform signature verification."
- **Prove it:** POST a made-up event with no `Stripe-Signature` header to the owner's own endpoint; it must return 400 and change nothing. (In one audit of two AI-built sites, both passed this.)
- **Fix:** call `constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)`, return 400 on failure, only then read the event. Use a separate `whsec_` secret per endpoint and per mode. **Who:** Claude
- **Severity:** critical, forged payments unlock paid features
- **Source:** https://docs.stripe.com/webhooks/best-practices · "Without verification, an attacker could send fake webhook events to your endpoint to trigger actions like fulfilling orders, granting account access, or modifying records." · read 2026-11-16

### SEC-SECRET-03 · Keys committed to git or sitting in git history
- **Applies when:** the project is, or ever was, a git repo (GitHub, GitLab, a zip someone shared, a Vercel/Lovable/Bolt export).
- **What goes wrong:** bots scrape new pushes within minutes, and deleting the file later does not remove it from history. GitHub: "if the sensitive data you need to remove is a secret (e.g. password/token/credential)... you need to revoke and/or rotate that secret."
- **Find it:** 1. `git ls-files | rg "(^|/)\.env"` (tracked env files; `.env.example` with fake values is fine). 2. `rg -n "\.env" .gitignore`; a bad result: no entry. 3. History: `git log --all --diff-filter=A --name-only --format= | rg "\.env|\.pem|credentials|serviceAccount"` and `git log --all -p -S"sk_live" --oneline` (repeat for `service_role`, `sk-ant-`, `AIza`, `whsec_`). Report commit hash and file, never the value. 4. If `gitleaks` or `trufflehog` is installed, run it on the repo; do not install anything without asking.
- **Prove it:** code only.
- **Fix:** add `.env*` (except `.env.example`) to `.gitignore`, `git rm --cached` tracked files. Rotate every key found, first, because history rewriting does not undo exposure. Optionally rewrite history with `git filter-repo` and force-push, then everyone re-clones. If the repo was ever public, treat all its keys as burned. Turn on GitHub secret scanning push protection. **Who:** owner rotates, Claude edits ignore files and runs the history search
- **Severity:** critical, scraped within minutes of a push
- **Source:** https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository · "if the sensitive data you need to remove is a secret (e.g. password/token/credential), as is often the case, then as a first step you need to revoke and/or rotate that secret." · read 2026-11-16

### SEC-PAY-04 · Replayed or duplicated webhooks (no idempotency)
- **Applies when:** the webhook grants credits, sends an email, creates an order, or ships anything.
- **What goes wrong:** Stripe can deliver the same event twice, and a captured valid event can be re-sent. Without a record of what was handled, credits are granted twice.
- **Find it:** 1. Open the webhook handler. A bad result: no table or column storing processed `event.id` (or the Checkout Session id), and a plain `insert`/`update credits = credits + n`. 2. Check for a unique constraint on `stripe_event_id` or `checkout_session_id`.
- **Prove it:** in test mode, `stripe events resend <evt_id>` (Stripe CLI) or re-deliver from the Dashboard; the second delivery must change nothing.
- **Fix:** insert `event.id` into a table with a unique constraint first; if the insert conflicts, return 200 and stop. Make fulfilment safe to run twice and concurrently for the same session id (a unique constraint plus one transaction). Verify the signature timestamp as the Stripe libraries do (default tolerance 5 minutes). When Claude calls Stripe's API to create charges or refunds, pass an idempotency key. **Who:** Claude
- **Severity:** high, double credits or double shipments
- **Source:** https://docs.stripe.com/webhooks/best-practices · "Webhook endpoints might occasionally receive the same event more than once." · read 2026-11-16. Also https://docs.stripe.com/checkout/fulfillment · "Correctly handle being called multiple times with the same Checkout Session ID." · read 2026-11-16

### SEC-PAY-05 · Test keys or test mode in production
- **Applies when:** the app is live or about to be, with Stripe.
- **What goes wrong:** live customers cannot pay (test keys), or the production webhook points at the wrong secret and every event fails. In the reverse direction, a demo with `sk_test_` accepts the 4242 test card and grants real access for nothing.
- **Find it:** 1. Vercel project settings, Environment Variables, Production scope: the key prefixes must be `sk_live_` or `rk_live_` and `pk_live_`; never print values, read the prefix only. 2. `rg -n "pk_test|sk_test|4242" -g "!node_modules"` outside tests and docs. 3. Stripe Dashboard (owner): a live-mode webhook endpoint exists and its `whsec_` is the one in Production env. 4. Test-mode objects (prices, coupons, products) "aren’t usable in live mode", so Price ids hard-coded from test mode break.
- **Prove it:** owner makes one real small purchase and refunds it.
- **Fix:** separate env values per Vercel environment (Production, Preview, Development), live Price ids per environment, a live webhook endpoint. Rotate keys that were pasted around during development. **Who:** owner
- **Severity:** high, payments fail or are free
- **Source:** https://docs.stripe.com/get-started/checklist/go-live · "Rotate your keys in case they’ve been saved somewhere outside of your codebase during development." · read 2026-11-16

### SEC-SECRET-05 · Old Google API key that now reaches Gemini
- **Applies when:** a Google API key (`AIza...`) sits in public page source for Maps, Firebase, YouTube or similar, in a Google Cloud project where the Gemini (Generative Language) API is, or later gets, enabled.
- **What goes wrong:** Google long called these keys non-secret. Truffle Security (2026) found "nearly 3,000 Google API keys, originally deployed for public services like Google Maps, that now also authenticate to Gemini". Someone copies the key from your page and bills Gemini calls to you. A related real case, a stolen Gemini key billed $82,314 in 48 hours (reported by The Register, 2026-03-03, from the developer's own account).
- **Find it:** 1. `rg -n "AIza[0-9A-Za-z_-]{35}"` in source and `.next/static`. 2. Owner opens Google Cloud Console, the key's project, APIs and Services, Enabled APIs: is "Generative Language API" on? 3. Credentials, each key: API restrictions set to only the APIs it needs? Application restrictions (HTTP referrer) set?
- **Prove it:** owner-only, in the console; do not call Gemini with a key found in source.
- **Fix:** restrict every browser key to the one API it serves and to your domains; put a separate, unexposed key (server-side only) on Gemini; disable the Generative Language API in projects that do not use it; set a billing budget with alerts (SEC-ABUSE-04); rotate keys that were unrestricted. **Who:** owner
- **Severity:** high, silent billing on a public key
- **Source:** https://trufflesecurity.com/blog/google-api-keys-werent-secrets-but-then-gemini-changed-the-rules · "that now also authenticate to Gemini even though they were never intended for it." · read 2026-11-16. Restriction advice: https://ai.google.dev/gemini-api/docs/api-key · "Adding restrictions to your API keys minimizes the potential damage if a key is compromised." · read 2026-11-16

### SEC-PAY-06 · Coupon, credit and balance abuse, double spend (race condition)
- **Applies when:** one-time promo codes, referral credits, gift cards, wallet or credit balances, limited inventory or slots, "free trial once" flags.
- **What goes wrong:** requests fired at the same instant all pass a check-then-write test. PortSwigger: a store's one-time promo code is claimed again and again, and "withdrawing or transferring cash in excess of your account balance" works the same way. Separately, bots farm referral credits by mass sign-up (OWASP API6:2023).
- **Find it:** 1. `rg -n "coupon|promo|redeem|credits|balance|inventory|stock|referral" app src supabase`. 2. Read the redeem path. A bad result: `select` the row, test in JS (`if (!coupon.used)`), then `update` in a second statement; or `credits = credits - n` after a separate balance check; no `unique` constraint on (user, coupon). 3. Check coupons have an expiry, a max-uses count and a per-user limit, and that referral credit needs a paid or verified action, not just a sign-up.
- **Prove it:** on the owner's own test data, fire 10 parallel redeem requests for a one-use code (a short script on their own project) and count how many succeed.
- **Fix:** one atomic statement: `update coupons set used = true where code = $1 and used = false returning *`, or a Postgres function with `select ... for update`; add `unique (user_id, coupon_id)`; `check (balance >= 0)`. "Use a single database transaction to check the payment matches the cart value and confirm the order." Where Stripe holds the coupon, use Stripe promotion codes with redemption limits (the object has `max_redemptions` and `restrictions.first_time_transaction` fields). Gate referral credit on a verified, paid event. **Who:** Claude
- **Severity:** high, money and stock leak
- **Source:** https://portswigger.net/web-security/race-conditions · "Avoid mixing data from different storage places." · read 2026-11-16. Business flows: https://api-security.owasp.org/editions/2023/en/0xa6-unrestricted-access-to-sensitive-business-flows · "An API Endpoint is vulnerable if it exposes a sensitive business flow, without appropriately restricting the access to it." · read 2026-11-16

### SEC-SECRET-04 · `.git` folder or `.env` file served by the live site
- **Applies when:** the site is deployed by copying the project folder to a server (VPS, shared host, a static upload) instead of building to an output folder; less likely on Vercel's builds.
- **What goes wrong:** the full code history, including deleted keys, downloads from `/.git/`. Intruder (2026-08-20) scanned 3.5 million hosts and found 28,000 exposed repositories; it recovered 400+ AWS keys and "107 live Stripe secret keys... a handful of which were still valid".
- **Find it:** 1. Ask where it deploys. If the web root is the project root, flag it. 2. Check the server or CDN config blocks dotfiles: nginx `location ~ /\.`, Apache `RedirectMatch 404 /\.git`. 3. In Next.js, confirm nothing sensitive sits in `public/` (everything there is served): `ls public`, look for `.env*`, `*.sql`, `*.zip`, `*.bak`.
- **Prove it:** `curl -s -o /dev/null -w "%{http_code}" https://<their-domain>/.git/HEAD` and `/.env`; 200 means exposed (their own domain only).
- **Fix:** deploy built output only; block dotfiles at the server; delete stray files from `public/`; rotate every key that was in the repo or `.env` (SEC-SECRET-08). **Who:** both
- **Severity:** critical, whole history downloadable
- **Source:** https://www.intruder.io/research/api-keys-bank-details-disciplinary-files-what-28-000-exposed-git-repos-gave-up · "107 live Stripe secret keys were recovered, a handful of which were still valid." · read 2026-11-16

### SEC-PAY-07 · Card testing on an open checkout
- **Applies when:** public checkout or card-save with guest access, or a donation or low-price page; Stripe-hosted Checkout or Payment Element reduces but does not remove it.
- **What goes wrong:** scripts run stolen card numbers through your form to see which work. Stripe: it "associates a large number of declines with your business" and can bring fees, early fraud warnings and disputes.
- **Find it:** 1. `rg -n "paymentIntents.create|setupIntents.create|customers.create|checkout.sessions.create" app src pages`. A bad result: the route needs no login, no CAPTCHA, no per-IP limit. 2. Confirm the integration is Checkout or Payment Element, not a custom card form. 3. Stripe Dashboard (owner): many small failed payments from varied cards.
- **Prove it:** call the endpoint 30 times from one IP on the owner's own test deployment; nothing should slow it.
- **Fix:** use Checkout or Payment Element; require login or a session before creating intents; add a CAPTCHA on card-validating requests; rate-limit (limit new customers per IP per day, purchases per product); turn on Radar. Stripe says single-IP rules alone are "usually not sufficient", so combine them. Never put a Stripe secret key in the client: "card testers can create payments and set up cards using your secret key." **Who:** both
- **Severity:** high, fees, disputes, account review
- **Source:** https://docs.stripe.com/disputes/prevention/card-testing · "Card testing is a type of fraudulent activity where someone tries to determine whether stolen card information is valid so that they can use it to make purchases." · read 2026-11-16

### SEC-SECRET-06 · Source maps in production
- **Applies when:** `productionBrowserSourceMaps: true` in `next.config.*`, or Vite/Webpack builds with `sourcemap: true` or `devtool: 'source-map'`, or `.map` files uploaded to the host.
- **What goes wrong:** anyone rebuilds your original code, comments and any hard-coded values. Real case: a Claude Code npm package shipped a source map (reported by The Hacker News; Anthropic called it a packaging error).
- **Find it:** 1. `rg -n "productionBrowserSourceMaps|sourcemap|devtool|source-map" next.config.* vite.config.* webpack.config.*`. 2. After a build: `find .next/static -name "*.map"` or `dist -name "*.map"`. 3. If `.npmignore` or `files` in `package.json` is used to publish a package, run `npm pack --dry-run` and look for `.map`.
- **Prove it:** `curl -sI https://<their-domain>/_next/static/chunks/<main chunk>.js.map` for a chunk name seen in page source; 200 means public.
- **Fix:** Next.js leaves them off in production unless opted in, so remove the opt-in. If you want maps for error tracking, upload them to the tracker (Sentry) and do not serve them. **Who:** Claude
- **Severity:** medium, code readable, aids other attacks
- **Source:** https://nextjs.org/docs/app/api-reference/config/next-config-js/productionBrowserSourceMaps · "During production builds, they are disabled to prevent you leaking your source on the client, unless you specifically opt-in with the configuration flag." · read 2026-11-16

### SEC-SECRET-07 · Secrets printed in logs or error pages
- **Applies when:** `console.log` of requests, env, headers or config; verbose error responses; logging vendors (Vercel logs, Sentry, Datadog); debug routes.
- **What goes wrong:** keys and tokens land in log systems many people can read, and stack traces tell strangers your file paths and table names.
- **Find it:** 1. `rg -n "console\.(log|error|debug)\((.*)(process\.env|headers|req\b|request\b|body|token|secret|key|authorization)" -i`. 2. `rg -n "process\.env\)|JSON.stringify\(process.env|printenv|/api/debug|/debug"`. 3. Look at catch blocks that return `error.message`, `error.stack` or the raw database error to the client. 4. Check Sentry or similar config for `sendDefaultPii` and request-body capture.
- **Prove it:** trigger a harmless error on the owner's own site (a malformed request to an API route) and read the response body for paths, SQL or stack text.
- **Fix:** log ids and event names, not payloads; redact `authorization`, `cookie`, `set-cookie` and key-shaped values; return a generic message and a request id to the client; delete debug routes. A key that has been logged counts as exposed: rotate it. **Who:** Claude edits, owner rotates
- **Severity:** medium, leaks to log readers
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html · "Access tokens", "Authentication passwords", "Database connection strings" and "Encryption keys and other primary secrets" "should usually not be recorded directly in the logs" · read 2026-11-16 (list quoted from the page; the framing sentence is the page's)

### SEC-PAY-08 · Stripe key with more power than the app needs (restricted keys)
- **Applies when:** the app uses `sk_live_` (unrestricted) for everything, or a third-party tool or AI agent has been handed a Stripe key.
- **What goes wrong:** one leak lets the thief refund, pay out and read every customer. A restricted key limits the damage. Stripe: "A RAK starts with rk_live_ or rk_test_" and can only do what you give it permission for.
- **Find it:** 1. `rg -n "STRIPE_SECRET_KEY|new Stripe\(" ` and note which API calls the app really makes (`checkout.sessions.create`, `customers.*`, `subscriptions.*`). 2. Owner checks Dashboard, Developers, API keys: is the key in Production `sk_live_` or `rk_live_`? 3. List every place a Stripe key is given out (MCP servers, Zapier, accounting, analytics).
- **Prove it:** owner-only, in the Dashboard.
- **Fix:** create a restricted key per component with Read, Write or None per resource (a webhook-only service needs almost nothing; a reporting tool gets read-only). Rotate on a schedule. Never give an AI agent an unrestricted live key. **Who:** owner
- **Severity:** medium, limits blast radius of a leak
- **Source:** https://docs.stripe.com/keys/restricted-api-keys · "Unlike a secret key that can do anything in your Stripe account, a RAK can do only what you give it permission to do." · read 2026-11-16

### SEC-PAY-09 · Refunds and disputes: the numbers that get an account reviewed
- **Applies when:** the app takes card payments through Stripe; matters most at low volume, where a few disputes are a large percentage.
- **What goes wrong:** Stripe: "The credit card processing industry standard recognizes dispute activity above 0.75% as excessive", and a sudden spike can trigger monitoring earlier. At 200 payments a month, two disputes is 1%. One popular post says the account "goes into review" above 0.75%; Stripe's page says networks may fine after a prolonged period and that Stripe "will proactively reach out", so that line is stronger than the source.
- **Find it:** 1. Is there a refund route or a visible way to ask for one? `rg -n "refund" -i app src`. 2. Statement descriptor and support email set (owner: Dashboard, Settings, Public details). 3. Terms say what is sold, the limit and the refund window; acceptance is logged (see the legal files). 4. Webhook handles `charge.dispute.created` and `radar.early_fraud_warning.created` (alerts the owner).
- **Prove it:** code and Dashboard only.
- **Fix:** descriptor shows the product name; receipts on; a visible refund path; alert on disputes and early fraud warnings; refund suspected fraud first, because "Refund fraudulent payments to avoid disputes." Do not claim a dispute fee amount without reading Stripe's pricing page. **Who:** both
- **Severity:** medium, account review risk
- **Source:** https://docs.stripe.com/disputes/measuring · "The credit card processing industry standard recognizes dispute activity above 0.75% as excessive" · read 2026-11-16

### SEC-SECRET-08 · How to rotate each kind of key (owner's checklist)
- **Applies when:** any entry above found a key exposed, or the owner is unsure. Rule: rotate even if nobody is known to have seen it. Stripe: "rotate it immediately even if you aren’t sure anyone saw it."
- **What goes wrong:** removing a key from code or history does not make it safe; the old key still works until the provider kills it. Rotating before fixing the leak means the new key leaks the same way, so fix the cause first (Supabase says the same).
- **Find it:** list every key class the app uses: `rg -o "process\.env\.[A-Z0-9_]+" -g "!node_modules" | sort -u`, then map each name to its provider.
- **Prove it:** after rotation, the old key must fail. Test it only with a harmless read on the owner's own account.
- **Fix, by provider (all steps the owner performs; Claude prepares the list and updates env names):**
  - **Stripe:** Dashboard, Developers, API keys, "..." then Rotate key; pick an expiry long enough to deploy; update Vercel env; check request logs on the new key; delete the old key. Then review for unknown payouts or connected accounts, refund fraud, and "rotate all additional secret and restricted keys". Source: https://support.stripe.com/questions/protecting-against-compromised-api-keys · "This will create a new key and set the compromised key to expire." · read 2026-11-16
  - **Supabase:** create a new secret key (Settings, API Keys), replace it everywhere, then delete the old one; for a legacy `service_role` key also deactivate the legacy keys and revoke the legacy JWT secret. Source: https://supabase.com/docs/guides/security/rotate-leaked-api-keys · "If the compromised key is a legacy service_role key, also revoke the legacy JWT secret." · read 2026-11-16
  - **Google (Gemini, Maps):** delete or regenerate the key in Credentials, add API and referrer restrictions (SEC-SECRET-05).
  - **OpenAI, Anthropic, Resend, Twilio, GitHub tokens:** revoke in the provider's console and create a new one; check usage for the period of exposure. (Provider steps not re-read for this file.)
  - **Vercel:** update Production, Preview and Development values and redeploy; `NEXT_PUBLIC_` values only change on a rebuild.
  - **Git history:** rotate first; rewriting history is cleanup, not protection (SEC-SECRET-03).
- **Severity:** critical, exposed key stays live
- **Source:** https://docs.stripe.com/keys-best-practices · "If a restricted or secret API key is exposed or compromised, rotate it immediately even if you aren’t sure anyone saw it." · read 2026-11-16

---

## Not covered here
- Row-level security, storage buckets and Supabase views: the database file.
- JWT secrets, timing-safe compares, `Math.random()` tokens, reset links, email enumeration: the auth file. (Not re-read here.)
- Sales tax, subscription cancellation, recurring-charge consent, refund policy law and terms of service: the legal files.
- Mobile in-app purchases (RevenueCat, StoreKit "Restore Purchases", sandbox key in a release build): the app-store file. Not Stripe, and not re-read here.
- Rate limits and spend caps: the abuse file (SEC-ABUSE-*).
- HTTP/2 Rapid Reset: applies only to people running their own HTTP/2 server; behind Vercel it is the host's job. Not re-read.

## Open questions
- A claim that a retry loop billed a team $1.6 million over a weekend circulates. I found no primary source for it: UNVERIFIED, so do not repeat it. The $82,000 Gemini figure is sourced (The Register, 2026-03-03, citing the developer's own post); it is a stolen key, not the Truffle finding.
- The Intruder finding is often quoted as "107 live Stripe secret keys". The source says 107 were "recovered", "a handful" still valid. Safer wording: 107 found, a few still valid.
- Not verified: Stripe's per-dispute fee ($15 in the Stripe post), Stripe Radar plan limits, exact promotion-code redemption behaviour beyond field names, and Vercel's behaviour when a `NEXT_PUBLIC_` value changes without a rebuild (Next.js docs say values are frozen at build time).
