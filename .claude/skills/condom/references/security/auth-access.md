# Security: who can log in and who can reach what (AUTH and ACCESS)

Scope: access control (database rules, keys, ids, admin routes, server actions, mass assignment, tenants) and authentication (sign-up, login,
reset, sessions, JWT, OAuth, CSRF). Stack order: Next.js + Supabase first, then Firebase, then general. All sources were opened 2026-11-16.
Quotes came through a summarising fetch tool, so spot-check a quote before repeating it to a user. Next.js 16 renamed `middleware` to
`proxy`; search for both file names. Supabase now calls the keys `sb_publishable_` (was `anon`) and `sb_secret_` (was `service_role`).

## Contents (worst and most common first)
- SEC-ACCESS-01 · Anyone can read or write a table (row-level security off)
- SEC-ACCESS-02 · A policy that lets the browser set the price, owner or status (permissive insert/update policy)
- SEC-ACCESS-03 · The master key is reachable by users (service-role key exposed)
- SEC-ACCESS-04 · Change an id, read a stranger's record (IDOR / BOLA)
- SEC-ACCESS-05 · A server action or API route that never asks who is calling
- SEC-ACCESS-06 · Login checked only in middleware (Next.js CVE-2025-29927)
- SEC-ACCESS-07 · "Is admin" decided in the browser or from a field the user can edit
- SEC-ACCESS-08 · The server saves every field the browser sends (mass assignment)
- SEC-ACCESS-09 · Views and functions that skip the rules (security definer, views without security_invoker)
- SEC-ACCESS-10 · File storage anyone can read or overwrite (bucket policies)
- SEC-ACCESS-11 · Firebase rules left open or "any signed-in user"
- SEC-ACCESS-12 · Reviews and posts under any name (identity fields taken from the client)
- SEC-ACCESS-13 · One customer's data mixed with another's (multi-tenant)
- SEC-AUTH-01 · A login link that forwards to another website (open redirect)
- SEC-AUTH-02 · Sign up with someone else's email (no verification, account pre-hijacking)
- SEC-AUTH-03 · "Log in with X" merges into the wrong account (unverified provider email)
- SEC-AUTH-04 · Server trusts a session it did not check (getSession vs getUser, JWT mistakes)
- SEC-AUTH-05 · Session cookies and tokens stored unsafely (cookie flags, localStorage, logout)
- SEC-AUTH-06 · Another site makes the user's browser act (CSRF on cookie routes)
- SEC-AUTH-07 · Reset link built from the Host header (password reset poisoning)
- SEC-AUTH-08 · Login, sign-up and reset reveal who has an account (user enumeration)
- SEC-AUTH-09 · Unlimited password guesses and weak passwords (credential stuffing)
- SEC-AUTH-10 · One-time codes and magic links that can be guessed (OTP brute force)
- SEC-AUTH-11 · Login page prints any message a link tells it to (reflected message)

---

### SEC-ACCESS-01 · Anyone can read or write a table (row-level security off)
- **Applies when:** Supabase (or any Postgres reached through the auto API) with a table in an exposed schema, normally `public`.
- **What goes wrong:** The publishable key ships in every visitor's browser by design. With row-level security (RLS) off, that key reads and writes the whole table. Tea's Firebase bucket leak (72,000 images) is the same class.
- **Find it:** 1. Open `supabase/migrations/*.sql`, `schema.sql`, `supabase/seed*`. For each `create table`, search for `enable row level security` for that table. 2. Search `disable row level security`. 3. If the Supabase MCP or SQL is available: `select schemaname, tablename, rowsecurity from pg_tables where schemaname='public';` Any `rowsecurity = false` is a finding. 4. Also list tables that have RLS on but no row in `pg_policies`: those lock everyone out (the app breaks), which AI often "fixes" with SEC-ACCESS-02.
- **Prove it:** With the publishable key from the user's `.env.local` (`NEXT_PUBLIC_SUPABASE_ANON_KEY` or `..._PUBLISHABLE_KEY`) and no login, `curl "$URL/rest/v1/<table>?select=*&limit=1" -H "apikey: $KEY"` against their own project. Rows back means open. Never run it against a project they do not own.
- **Fix:** `alter table public.<t> enable row level security;` then one policy per operation scoped to `(select auth.uid())`. Add the policies in a migration. **Who:** Claude writes it; owner applies it to production.
- **Severity:** critical, whole table readable by anyone.
- **Source:** https://supabase.com/docs/guides/database/postgres/row-level-security · "Enable RLS on every table in an exposed schema." and "Once RLS is enabled, no data is accessible through the API when using a publishable key, until you create policies." · read 2026-11-16

### SEC-ACCESS-02 · A policy that lets the browser set the price, owner or status (permissive insert/update policy)
- **Applies when:** RLS is on, but an INSERT or UPDATE policy lets the client write columns the server should own (totals, prices, `status`, `paid`, `user_id`, `role`, credits). Also `using (true)`, or a policy that filters on a value the client sends.
- **What goes wrong:** In one audit of two AI-built restaurant sites, a build had server code that priced orders from the menu, next to a database rule that let any customer insert an order row with its own `total_cents`. Result: "A $0.00 order for 50 briskets was created and the site marked it PAID.". The other build closed it by creating orders only through database functions that set prices from the menu.
- **Find it:** 1. Open every `create policy` in the migrations. 2. Flag `using (true)` or `with check (true)` on anything but public reference data. 3. For INSERT/UPDATE on orders, bookings, balances, profiles: does `with check` pin `user_id = (select auth.uid())` only, while price, total, status columns stay writable? 4. Flag policies comparing to a request value instead of `auth.uid()`. 5. Check a matching table-level `grant insert, update` on columns that should be server-only.
- **Prove it:** Test accounts A and B on the user's own project. Signed in as A with the supabase-js client, `insert` an order row with `total_cents: 0`, or `update` your own profile with `role: 'admin'`. If the row is accepted, it is a finding. Delete the test rows after.
- **Fix:** Remove the client INSERT/UPDATE policy for money and status columns. Create rows only through a server route, or a `security definer` function with a pinned `search_path` that checks `auth.uid()` and reads the price from the database (see SEC-ACCESS-09 for making such a function safe); or revoke column privileges (`revoke update (role) on profiles from authenticated`). Add `with check` that matches `using`. **Who:** Claude
- **Severity:** critical, free orders or self-granted privileges.
- **Source:** https://supabase.com/docs/guides/database/postgres/row-level-security · "Use it only for data that is meant to be public." (on `true`) and "To perform an UPDATE operation, a corresponding SELECT policy is required." · read 2026-11-16. Real case: an audit of two AI-built sites (2026-11), unpublished.

### SEC-ACCESS-03 · The master key is reachable by users (service-role key exposed)
- **Applies when:** Supabase secret/service-role key used anywhere a visitor can reach: a `NEXT_PUBLIC_` variable, a client component, a mobile app, a committed `.env`, or a server route that uses it to answer a user's request without checking who they are.
- **What goes wrong:** That key skips every policy. Anyone holding it has full read and write on the project. Two ways it leaks: shipped in the bundle, or used server-side for a user's request with no ownership check (the route then acts as the master key for any caller).
- **Find it:** 1. `grep -rniE "service_role|SUPABASE_SERVICE|sb_secret" --include=* . --exclude-dir=node_modules --exclude-dir=.next`. 2. Any match in a file with `'use client'`, in `NEXT_PUBLIC_*`, or in `.env*` that is tracked by git (`git ls-files | grep env`; `git log -p -S service_role`). 3. For each server file that creates an admin client, confirm an auth check runs before it, and the query is filtered by the caller's id. 4. Search the built output: `grep -rl "sb_secret_\|service_role" .next/static`.
- **Prove it:** Code only. Never print the key value in chat.
- **Fix:** Remove the key from client code; rename so it has no `NEXT_PUBLIC_` prefix; use the user-scoped client (`createServerClient` with cookies) by default and the admin client only for jobs with no user (webhooks, cron). **Rotate the key if it ever reached the browser or a commit.** **Who:** both (Claude edits code; owner rotates in the Supabase dashboard).
- **Severity:** critical, bypasses every access rule.
- **Source:** https://supabase.com/docs/guides/api/api-keys · "A secret key bypasses every Row Level Security policy you have." and "Server-only. Never prefix these, or your bundler will ship the key." · read 2026-11-16

### SEC-ACCESS-04 · Change an id, read a stranger's record (IDOR / BOLA)
- **Applies when:** Any route, page or action that loads a record by an id from the URL, body or query (`/orders/[id]`, `?userId=`) using a client with elevated access, or an ORM that is not behind RLS (Prisma, Drizzle, Firebase Admin).
- **What goes wrong:** The user is logged in, so the endpoint answers, but nothing checks that the record is theirs. Attackers change `1001` to `1002`. OWASP API1: attackers exploit it "by manipulating the ID of an object that is sent within the request."
- **Find it:** 1. List every route handler (`app/api/**/route.ts`), server action (`'use server'`) and dynamic page (`[id]`). 2. For each, find the line that fetches by id. 3. Bad: the query is `where id = $1` with nothing about the caller. Good: `where id = $1 and user_id = session.userId`, or a Supabase user-scoped client under RLS. 4. Flag any handler that reads `userId` from the body instead of the session (treat it as critical).
- **Prove it:** Two test accounts. As A, copy a record id; as B, request it (browser URL or `curl` with B's cookie) on the user's own running app. B receiving A's data is the finding. Random ids (UUID) make guessing hard but are not the fix.
- **Fix:** Put the ownership check in one data-access function used by every route (Next.js's "Data Access Layer"); derive the user id from the session only; add RLS as a second layer. **Who:** Claude
- **Severity:** critical, one account reads everyone's data.
- **Source:** https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization · "Prefer the use of random and unpredictable values as GUIDs for records' IDs." and "manipulating the ID of an object that is sent within the request" · read 2026-11-16

### SEC-ACCESS-05 · A server action or API route that never asks who is calling
- **Applies when:** Next.js App Router with `'use server'` functions or `route.ts` handlers; any API route in any framework.
- **What goes wrong:** Hiding a button in the UI does nothing: each server action is an endpoint a client can call with any arguments. Next.js: "The `"use server"` annotation exposes an end point that makes all exported functions invokable by the client."
- **Find it:** 1. `grep -rln "use server" app src`. For every exported function in those files, the first lines must verify the session and check the user may do this to this record. 2. For every `route.ts`, same. 3. Flag exports that were meant to be internal helpers but live in a `'use server'` file (all exports become endpoints). 4. Flag arguments used without a schema check (Zod).
- **Prove it:** `curl -X POST` the route with no cookie on the user's own running app: expect 401/403. For a server action, call it from a logged-out browser session via the form or devtools network tab.
- **Fix:** Start every action and handler with `const session = await verifySession()` (a data-access-layer function), return 401/403, then validate arguments. Keep helpers out of `'use server'` files. **Who:** Claude
- **Severity:** critical, unauthenticated writes and reads.
- **Source:** https://nextjs.org/docs/app/guides/authentication · "Treat Server Actions with the same security considerations as public-facing API endpoints, and verify if the user is allowed to perform a mutation." (the page's wording links the term; the sentence is in its Server Actions section) · read 2026-11-16. Also https://nextjs.org/blog/security-nextjs-server-components-actions.

### SEC-ACCESS-06 · Login checked only in middleware (Next.js CVE-2025-29927)
- **Applies when:** Next.js **self-hosted** (`next start` or `output: 'standalone'`) on an unpatched version, where `middleware.ts` (renamed `proxy.ts` in 16) is the only check. Does not apply to Vercel-hosted apps: the postmortem says Vercel was "incidentally invulnerable" (also Netlify and Cloudflare Workers). Still wrong design on any host.
- **What goes wrong:** A crafted request header skipped middleware entirely. CVE-2025-29927, CVSS 9.1: "It is possible to bypass authorization checks within a Next.js application".
- **Find it:** 1. `grep '"next"' package.json` and the lockfile. Vulnerable: 12.x below 12.3.5, 13.x below 13.5.9, 14.x below 14.2.25, 15.x below 15.2.3 (11.x has no patch; use the workaround). 2. Open `middleware.ts` / `proxy.ts`: is it the only place that blocks `/dashboard` or `/admin`? 3. Are page components, route handlers and server actions each checking the session? 4. Does the matcher exclude `api` (so a Server Function call on an excluded path skips it)?
- **Prove it:** Version check is enough. Do not send the exploit header to a site the user does not own.
- **Fix:** Upgrade to a patched version (or any 15.2.3+/16). If you cannot, block external requests carrying `x-middleware-subrequest` at the proxy. Move real checks to each route, action and the data layer; keep middleware for redirects. **Who:** both (owner deploys).
- **Severity:** critical, full bypass, but only self-hosted.
- **Source:** https://github.com/advisories/GHSA-f82v-jwr5-mffw · "It is possible to bypass authorization checks within a Next.js application" · read 2026-11-16. https://vercel.com/blog/postmortem-on-next-js-middleware-bypass · "We do not recommend Middleware to be the sole method of protecting routes in your application." · read 2026-11-16

### SEC-ACCESS-07 · "Is admin" decided in the browser or from a field the user can edit
- **Applies when:** An admin area or role check that reads `user.isAdmin` in React, a cookie, a query string, or `user_metadata`.
- **What goes wrong:** The browser can be edited. In Supabase, `raw_user_meta_data` is writable by the user; only app metadata is not. Next.js: a searchParam "should not be used to track things like `?isAdmin=true`."
- **Find it:** 1. `grep -rnE "isAdmin|is_admin|role ===|role ==" app src components`. 2. Is the same check enforced on the server route/action behind every admin page (SEC-ACCESS-05)? 3. In SQL: `grep -rn "user_metadata" supabase/` inside policies or functions = bad. 4. Admin pages under `/admin`, `/dashboard/admin`, `/debug`, `/api/admin` with no session check.
- **Prove it:** As a normal test user, request the admin API route or open the admin page directly on the user's own app. Expect 403.
- **Fix:** Store roles in `app_metadata` (set only by server/admin code) or a `user_roles` table with no client write policy; check on the server and in RLS; deny by default. **Who:** Claude
- **Severity:** critical, a customer becomes admin.
- **Source:** https://supabase.com/docs/guides/database/postgres/row-level-security · "raw_app_meta_data - cannot be updated by the user, so it's a good place to store authorization data." · read 2026-11-16. https://api-security.owasp.org/editions/2023/en/0xa5-broken-function-level-authorization · "Don't assume that an API endpoint is regular or administrative only based on the URL path." · read 2026-11-16

### SEC-ACCESS-08 · The server saves every field the browser sends (mass assignment)
- **Applies when:** Update/create endpoints that spread the request body into the database: `.update(body)`, `db.user.update({data: req.body})`, `{...input}`.
- **What goes wrong:** A user adds `"role":"admin"` or `"is_premium":true` to their own profile update. OWASP: "avoid using functions that automatically bind a client's input into code variables, internal objects, or object properties."
- **Find it:** 1. `grep -rnE "\.update\((body|data|input|req\.body|await req\.json\(\))|\.\.\.(body|input|data)\b" app src`. 2. Check every `supabase.from(...).update/upsert` whose argument comes straight from a form or JSON. 3. Check `FormData` → `Object.fromEntries(formData)`.
- **Prove it:** As a normal user on the user's own app, send the profile update with an extra `role` / `credits` field; reread the profile. Changed means a finding.
- **Fix:** Parse with a schema that lists only editable fields (Zod `.pick` / `.strict()`), write those fields only; also revoke column privileges in SQL for protected columns. **Who:** Claude
- **Severity:** high, self-service privilege or credit.
- **Source:** https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization · "avoid using functions that automatically bind a client's input into code variables, internal objects, or object properties." · read 2026-11-16. Fix pattern: https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html · "Prefer dedicated input objects, such as Data Transfer Objects (DTOs), containing only fields the caller may edit." · read 2026-11-16

### SEC-ACCESS-09 · Views and functions that skip the rules (security definer, views without security_invoker)
- **Applies when:** Supabase/Postgres with RLS and any view in `public`, or any SQL function exposed through `rpc()`.
- **What goes wrong:** A view returns rows its base table's policies hide; a `security definer` function runs as its creator. Supabase: "Views bypass RLS by default because they are usually created with the postgres user." and "A `security definer` function can return rows the caller isn't allowed to read." Any role can call a new function by default, including `anon`.
- **Find it:** 1. `grep -rniE "create (or replace )?view" supabase/` and check each for `security_invoker = true` (Postgres 15+). 2. `grep -rniE "security definer" supabase/`: does each set `search_path`, check `auth.uid()` inside, and have `revoke execute ... from public, anon`? 3. Run the Supabase advisor if the MCP is available (`get_advisors`, security).
- **Prove it:** Call the function with the publishable key and no login: `curl -X POST "$URL/rest/v1/rpc/<fn>" -H "apikey: $KEY" -H "Content-Type: application/json" -d '{}'` on the user's own project; data back means exposed.
- **Fix:** `alter view <v> set (security_invoker = true);` prefer `security invoker` functions; for definer functions, pin `search_path`, check the caller inside, revoke execute from `public`/`anon`. **Who:** Claude
- **Severity:** high, silent bypass of correct-looking policies.
- **Source:** https://supabase.com/docs/guides/database/functions · "A `security definer` function can return rows the caller isn't allowed to read." and "Restrict execution by default, then grant access to the roles that need each function." · read 2026-11-16 (view quote: the RLS page above).

### SEC-ACCESS-10 · File storage anyone can read or overwrite (bucket policies)
- **Applies when:** Supabase Storage, Firebase Storage or S3, holding user uploads or private files (IDs, invoices, photos).
- **What goes wrong:** A bucket marked public serves every file to anyone with the URL; a loose policy lets any user overwrite other users' files. Tea's leak (72,000 images from an open Firebase bucket) is the well-known example.
- **Find it:** 1. `grep -rniE "create_bucket|createBucket|public: true|storage.buckets" supabase/ app src`. 2. Every private-data bucket must be `public = false`. 3. Open policies on `storage.objects`: each should scope to the caller's folder, e.g. `(storage.foldername(name))[1] = (select auth.uid()::text)`, and limit type and size on the server. 4. Upsert needs SELECT and UPDATE too, so an over-broad update policy allows overwrites.
- **Prove it:** Open a file URL from a private bucket in a logged-out browser on the user's own project. If it loads, it is public.
- **Fix:** Private buckets plus owner-scoped policies and signed URLs for reads; public only for assets meant to be public. **Who:** Claude (policies); owner (existing leaked files: assume they were copied).
- **Severity:** high, private files readable by URL.
- **Source:** https://supabase.com/docs/guides/storage/security/access-control · "By default Storage does not allow any uploads to buckets without RLS policies." · read 2026-11-16

### SEC-ACCESS-11 · Firebase rules left open or "any signed-in user"
- **Applies when:** Firestore, Realtime Database or Cloud Storage with the web SDK from the browser. Firebase has Security Rules, not RLS. Admin SDK and server libraries bypass rules and use IAM instead.
- **What goes wrong:** `allow read, write: if true;` lets anyone steal, modify or delete data; `if request.auth != null` gives "Any logged-in user has read and write access to your entire database", and anyone can create an account. Firebase: "if you deploy your app, it's publicly accessible" even before launch.
- **Find it:** 1. Open `firestore.rules`, `storage.rules`, `database.rules.json`. 2. Search `if true`, `request.auth != null` with no ownership term, and `.endsWith('@` without `email_verified`. 3. Rules should compare `request.auth.uid` to the path or a field. 4. `firebase.json` shows which rules files deploy. 5. Test-mode rules may carry an expiry date (not documented on the pages opened; check the console Rules tab).
- **Prove it:** Run the Firebase emulator rules unit tests, or read the user's own Firestore with a fresh anonymous client SDK from a scratch script. Do not probe anyone else's project id.
- **Fix:** Default deny; match on `request.auth.uid`; check `request.auth.token.email_verified`; limit size and content type in storage rules. Remember "rules are not filters": queries must match the rule's constraint. **Who:** Claude (rules); owner deploys (`firebase deploy --only firestore:rules`).
- **Severity:** critical, whole database public.
- **Source:** https://firebase.google.com/docs/firestore/security/insecure-rules · "Any logged-in user has read and write access to your entire database." · read 2026-11-16. https://firebase.google.com/docs/rules/basics · "if you deploy your app, it's publicly accessible" · read 2026-11-16

### SEC-ACCESS-12 · Reviews and posts under any name (identity fields taken from the client)
- **Applies when:** A table with `author_name`, `display_name`, `email`, `user_id`, photo path or similar written from a form, and the policy only checks "signed in".
- **What goes wrong:** In one audit of two AI-built restaurant sites, "Fake reviews under any name" appeared on both builds, because the name came from the request. The audit's fix: take review names from the profile, restrict photo paths, limit reviews per customer.
- **Find it:** 1. Find insert code for reviews/comments/messages. 2. Is the author column filled from the session/profile server-side? 3. Is `user_id` forced to `auth.uid()` in `with check`? 4. Are file paths for attached photos checked to be in the caller's own folder? 5. Is there a per-user cap?
- **Prove it:** As a test user, post a review with `author_name: "Someone Else"`; check whether it displays that name.
- **Fix:** Default the author column from the profile in the database (`default`, trigger, or a function) and drop it from the client-writable columns; pin `user_id` in `with check`; cap per user. **Who:** Claude
- **Severity:** medium, impersonation and fake reviews.
- **Source:** an audit of two AI-built sites (2026-11), unpublished. Principle: https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization · "allows a user to change, add/or delete the value of a sensitive object's property" · read 2026-11-16

### SEC-ACCESS-13 · One customer's data mixed with another's (multi-tenant)
- **Applies when:** The app has teams, workspaces, shops or organisations, with a `team_id`/`org_id` column.
- **What goes wrong:** Checks prove "logged in" but not "member of this team". Next.js: "Just because the user is on `/[team]/` doesn't mean that they have access to that team, that needs to be verified when reading data."
- **Find it:** 1. List tables with a tenant column. 2. Each policy/query should join to a membership table with the caller's id. 3. Check invitations and "switch team" routes for the same check. 4. Search for queries filtering only by id with no tenant term.
- **Prove it:** Two accounts in two different teams on the user's own app; A requests B's team page/API.
- **Fix:** A `team_members` table and a `security invoker` helper `is_member(team_id)` used in every policy; one data-access function that takes the caller. **Who:** Claude
- **Severity:** high, cross-customer data leak.
- **Source:** https://nextjs.org/blog/security-nextjs-server-components-actions · "Just because the user is on `/[team]/` doesn't mean that they have access to that team, that needs to be verified when reading data." · read 2026-11-16

---

### SEC-AUTH-01 · A login link that forwards to another website (open redirect)
- **Applies when:** Login, OAuth callback, magic-link or sign-out routes that take `?next=`, `?redirect=`, `?returnTo=` or `redirectTo` and send the user there afterwards.
- **What goes wrong:** Attackers send a real link on your domain that lands on a lookalike page after login. In one audit of two AI-built restaurant sites it appeared on both builds, caused by a string-prefix check. OWASP names raw prefix matching as a bypass.
- **Find it:** 1. `grep -rnE "searchParams\.get\(['\"](next|redirect|returnTo|callbackUrl|redirectTo)|redirect\(|NextResponse\.redirect" app src`. 2. Look at `app/auth/callback/route.ts`, `app/auth/confirm/route.ts`, login actions. 3. Bad: `startsWith('/')` (matches `//evil.com`), or the value passed straight to `redirect()`. 4. Supabase dashboard Auth, URL Configuration: wildcards like `https://*` or `**` in the redirect allow list; Site URL should be production.
- **Prove it:** On the user's own running app, open `/login?next=//example.org` or `/auth/callback?next=https://example.org` and complete a login with a test account; see if you end up on example.org.
- **Fix:** Accept only a relative path: parse with `new URL(next, origin)`, require same origin and a path starting with a single `/`, else go to `/`. Use exact URLs in the Supabase redirect allow list. **Who:** Claude (code); owner (dashboard list).
- **Severity:** medium, phishing under your domain.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html · "If used, do not allow the URL as user input for the destination." and "Do not use raw prefix or suffix matching." · read 2026-11-16. https://supabase.com/docs/guides/auth/redirect-urls · "setting the exact redirect URL path for your site URL in production." · read 2026-11-16

### SEC-AUTH-02 · Sign up with someone else's email (no verification, account pre-hijacking)
- **Applies when:** Email-and-password sign-up, or a social login that merges with an existing email, where the app lets an unconfirmed account be used.
- **What goes wrong:** An attacker registers the victim's email first, waits, and gets in after the victim signs up. The USENIX study: "we analyzed 75 popular services and found that at least 35 of these were vulnerable to one or more account pre-hijacking attacks."
- **Find it:** 1. Supabase dashboard: Auth, Providers, Email, "Confirm email". It is on by default for hosted projects and off for self-hosted and local. 2. Firebase: is `email_verified` checked before access? 3. In custom auth: search the sign-up code for a verified flag; does anything real run for an unverified user? 4. After a password reset, are old sessions ended?
- **Prove it:** Sign up with a test email and try to use the app before clicking the confirmation link.
- **Fix:** Turn on confirmation; gate real access on a confirmed email; end other sessions on reset. Set up custom SMTP: the built-in sender allows 2 emails per hour, so teams switch confirmation off to "fix" it, which is the hole. **Who:** both.
- **Severity:** high, account takeover before the victim arrives.
- **Source:** https://www.usenix.org/conference/usenixsecurity22/presentation/sudhodanan (abstract, read via search excerpt) · "we analyzed 75 popular services and found that at least 35 of these were vulnerable to one or more account pre-hijacking attacks." · read 2026-11-16. https://supabase.com/docs/guides/auth/auth-email · "You can configure whether users need to verify their email to sign in." · read 2026-11-16

### SEC-AUTH-03 · "Log in with X" merges into the wrong account (unverified provider email)
- **Applies when:** Google/GitHub/Microsoft/Apple login plus password accounts, linking by email. Auth.js `allowDangerousEmailAccountLinking`, custom merge code, or Supabase identity linking.
- **What goes wrong:** If a provider returns an email the owner never proved, matching on it hands over the account. Descope's post on Microsoft is often cited: "the email claim is both mutable and unverified so it should never be trusted or used as an identifier".
- **Find it:** 1. `grep -rn "allowDangerousEmailAccountLinking" .`. 2. Look at `signIn`/`jwt` callbacks and `onConflict: 'email'` upserts. 3. Does code look users up by `email` from a provider profile without checking `email_verified`? 4. Identify users by the provider's stable subject id.
- **Prove it:** Code only.
- **Fix:** Remove automatic linking unless the provider guarantees verification; link only after the signed-in user proves ownership of both; key on provider + subject id. **Who:** Claude
- **Severity:** high, silent takeover.
- **Source:** https://authjs.dev/reference/core/errors · "For security reasons, Auth.js does not automatically link OAuth accounts to existing accounts if the user is not signed in." · read 2026-11-16. The Microsoft claim comes from Descope; UNVERIFIED by me, I did not open descope.com/blog/post/noauth today.

### SEC-AUTH-04 · Server trusts a session it did not check (getSession vs getUser, JWT mistakes)
- **Applies when:** Supabase SSR in Next.js; any app that verifies JWTs itself.
- **What goes wrong:** Supabase: `getSession()` "isn't re-validated against the Auth server" and it says "Never trust supabase.auth.getSession() inside server code such as Proxy." JWT classics: decoding without verifying, `alg: none`, guessable HS256 secret (PortSwigger: a forged token lets an attacker "escalate their own access or impersonate other users").
- **Find it:** 1. `grep -rn "auth.getSession" app src lib`. A server-side use that gates access is a finding; use `getUser()` or `getClaims()`. 2. `grep -rnE "jwt\.decode|jsonwebtoken|jose|jwtVerify|JWT_SECRET"`. Is it `verify` with `algorithms: [...]` pinned? 3. Is the secret a long random env value, not `secret` or a committed string? 4. Do tokens carry an `exp`? Next.js's example sets `.setExpirationTime('7d')`.
- **Prove it:** Code only. Do not forge tokens against a deployed app.
- **Fix:** Use `getUser()`/`getClaims()` server-side; pin algorithms; generate the secret with `openssl rand -base64 32`; set expiry; prefer your auth provider's sessions over home-made JWTs. **Who:** Claude (code); owner rotates a weak secret.
- **Severity:** high, forged or unchecked sessions.
- **Source:** https://supabase.com/docs/guides/auth/server-side/nextjs · "Never trust supabase.auth.getSession() inside server code such as Proxy." · read 2026-11-16. https://portswigger.net/web-security/jwt · "Always set an expiration date for any tokens that you issue." · read 2026-11-16

### SEC-AUTH-05 · Session cookies and tokens stored unsafely (cookie flags, localStorage, logout)
- **Applies when:** Cookie sessions you set yourself, or tokens in `localStorage`.
- **What goes wrong:** Script on the page (any XSS or bad third-party script) reads `localStorage` and steals live sessions. Cookies without `Secure`/`HttpOnly`/`SameSite` leak or ride cross-site. A logout that only clears the cookie leaves the session valid.
- **Find it:** 1. `grep -rnE "localStorage\.(set|get)Item\(['\"][^'\"]*(token|jwt|session|auth)" app src`. 2. `grep -rnE "cookies\(\)\.set|cookieStore\.set|Set-Cookie|res\.cookie"` and read the options: `httpOnly: true, secure: true, sameSite: 'lax'` plus expiry. 3. Logout and password change: does the server invalidate the session? 4. Supabase `@supabase/ssr` stores the session in cookies; plain `supabase-js` in the browser may keep it in browser storage (UNVERIFIED, not confirmed in docs read today).
- **Prove it:** Devtools, Application tab, Cookies on the user's own site: check the HttpOnly/Secure/SameSite columns. Log out, then replay the old cookie with `curl`.
- **Fix:** Set the flags; keep tokens out of `localStorage`; expire sessions; end them server-side on logout and password change. **Who:** Claude
- **Severity:** medium, depends on a second bug (XSS) or shared devices.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html · "Session cookies must explicitly set `SameSite=Strict` (preferred) or `SameSite=Lax`." · read 2026-11-16. https://nextjs.org/docs/app/guides/authentication (cookie options list: HttpOnly, Secure, SameSite, Max-Age) · read 2026-11-16

### SEC-AUTH-06 · Another site makes the user's browser act (CSRF on cookie routes)
- **Applies when:** Cookie-based sessions with `route.ts` handlers, API routes or GET links that change data. Server actions get a built-in Origin check (Next.js 14 and later, per its blog); route handlers do not.
- **What goes wrong:** A malicious page auto-submits a form to your endpoint with the victim's cookie attached. OWASP: SameSite "does not replace a proper CSRF defense in most deployments."
- **Find it:** 1. List `route.ts` handlers with POST/PUT/PATCH/DELETE that read cookies. 2. Any `export async function GET` that writes data or logs out (state change on GET). 3. Check `Origin` compared to your host, or a CSRF token, or a custom header the browser will not send cross-site. 4. Session cookie `SameSite` is not `None`. 5. If CORS is `Access-Control-Allow-Origin: *` with credentials, that is its own finding.
- **Prove it:** From a different origin (a local HTML file served on another port), POST to the user's own route with `credentials: 'include'`, while logged in on the app.
- **Fix:** Verify `Origin`/`Host` in handlers; never change state on GET; keep SameSite=Lax at least; use a token for cross-site forms. **Who:** Claude
- **Severity:** medium, needs a victim visit.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html · "If the Origin header is present, verify that its value matches the target origin." · read 2026-11-16. https://nextjs.org/blog/security-nextjs-server-components-actions · "Server Actions in Next.js 14 also compares the `Origin` header to the `Host` header" (2023 post, wording says Next.js 14; confirm for the installed version).

### SEC-AUTH-07 · Reset link built from the Host header (password reset poisoning)
- **Applies when:** You build the reset or confirmation URL yourself with `req.headers.host`, `x-forwarded-host`, or `new URL(request.url).origin` behind a proxy.
- **What goes wrong:** An attacker requests a reset for the victim with a forged Host header; the emailed link points to the attacker's server, and the token lands there.
- **Find it:** 1. `grep -rnE "headers\(\)\.get\(['\"](host|x-forwarded-host|origin)|req\.headers\.host|request\.headers\.get\(['\"]host" app src`. 2. Check where reset and verify emails are built (Resend/SendGrid templates, `resetPasswordForEmail({ redirectTo })`). 3. Is `redirectTo` taken from the request or from `NEXT_PUBLIC_SITE_URL`?
- **Prove it:** On the user's own app, `curl -X POST` the reset endpoint with `-H "Host: example.org"` and a test email; read the email's link.
- **Fix:** Use a fixed `SITE_URL` env for every emailed link. Tokens: cryptographically random, long, single use, expiring. **Who:** Claude
- **Severity:** high, account takeover with one request.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html · "Don't rely on the Host header while creating the reset URLs to avoid Host Header Injection attacks." · read 2026-11-16

### SEC-AUTH-08 · Login, sign-up and reset reveal who has an account (user enumeration)
- **Applies when:** Any email/username login. Matters most where knowing a person uses the app is itself sensitive.
- **What goes wrong:** Different messages or response times for known and unknown emails let anyone test a list. Often a low severity alone; it feeds credential stuffing.
- **Find it:** 1. Read the login, sign-up and reset code for messages like "No account with that email" / "Email already registered". 2. Compare status codes and timing between a real and fake email. 3. Supabase `resetPasswordForEmail()` "doesn't reveal whether an account exists for the given email address"; custom endpoints often do.
- **Prove it:** Submit a known and an unknown email to each form on the user's own app; compare text, status and time.
- **Fix:** One generic message ("If that email is in our database, we will send you an email"), same status, same path. **Who:** Claude
- **Severity:** low, helps later attacks.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html · "An application should respond (both HTTP and HTML) in a generic manner." · read 2026-11-16

### SEC-AUTH-09 · Unlimited password guesses and weak passwords (credential stuffing)
- **Applies when:** Password login. Supabase Auth has its own limits (check the Rate Limits page in the dashboard); custom login routes usually have none.
- **What goes wrong:** Bots try leaked email and password pairs and brute-force passwords. OWASP: "Multi-factor authentication (MFA) is by far the best defense against the majority of password-related attacks."
- **Find it:** 1. Custom login/reset/sign-up route? Search for a limiter (`@upstash/ratelimit`, `rate-limit`, Vercel firewall rules). None means a finding. 2. Password rules in the sign-up code and auth dashboard. 3. Supabase leaked-password protection: it checks HaveIBeenPwned and "is available on the Pro Plan and above"; some write-ups say Supabase has one built in without the plan caveat.
- **Prove it:** Code and settings only. Do not send a burst of attempts to a live site.
- **Fix:** Limit per account and per IP (OWASP: lockout counters tied to the account, not the IP, to avoid lockout abuse use reset-flow recovery); minimum 8 characters with MFA, 15 without (NIST via OWASP), allow 64+; offer MFA; enable leaked-password check if on a plan that has it. **Who:** both.
- **Severity:** high, account takeover at scale.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html · "Multi-factor authentication (MFA) is by far the best defense against the majority of password-related attacks." · read 2026-11-16. https://supabase.com/docs/guides/auth/password-security · "Leaked password protection is available on the Pro Plan and above." · read 2026-11-16

### SEC-AUTH-10 · One-time codes and magic links that can be guessed (OTP brute force)
- **Applies when:** Your own code for email/SMS codes, magic links or invite tokens (not Supabase's or Clerk's hosted flow).
- **What goes wrong:** A 6-digit code with no attempt limit and a long life can be tried one million times; `Math.random()` tokens are predictable (MDN says so).
- **Find it:** 1. `grep -rnE "Math\.random|randomInt|generateCode|otp|magic" app src lib`. 2. Do codes come from `crypto.randomBytes`/`crypto.getRandomValues`? 3. Is there an attempt counter per code, a short expiry, single use? 4. Is the compare constant-time?
- **Prove it:** Code only.
- **Fix:** CSPRNG tokens of at least 128 bits for links; for short codes, cap attempts (about 5), expire in minutes, invalidate on use. **Who:** Claude
- **Severity:** high when custom, low when hosted.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html · "Single use and expire after an appropriate period." and "Sufficiently long to protect against brute-force attacks." · read 2026-11-16. UNVERIFIED: the "about 5 attempts" figure, no source opened.

### SEC-AUTH-11 · Login page prints any message a link tells it to (reflected message)
- **Applies when:** A login or error page that shows `?error=...`, `?message=...` as page text.
- **What goes wrong:** In one audit of two AI-built restaurant sites (low severity): the page shows any message a link tells it to, so a link can put attacker-written text on your trusted login page ("Call this number to unlock your account").
- **Find it:** 1. `grep -rnE "searchParams\.(error|message|msg)|searchParams\.get\(['\"](error|message)" app src`. 2. Is the text rendered directly, or mapped from a short code to a fixed message?
- **Prove it:** Open `/login?error=Test+message` on the user's own app; if the text appears, it is a finding. (Rendered as plain text, so only a spoofing issue; as HTML it is XSS.)
- **Fix:** Pass an error code and look up the text from a fixed table. **Who:** Claude
- **Severity:** low, spoofed text on your page.
- **Source:** an audit of two AI-built sites (2026-11), unpublished. UNVERIFIED against an outside standard: I did not open a primary source for content spoofing today.

---

## Not covered here
- Rate limits on AI, email and SMS routes, and cost abuse (belongs in the abuse/cost file). SEC-AUTH-09 covers login only.
- Webhook signatures, Stripe price trust, secrets in git, XSS, injection, uploads, headers and clickjacking: other files. Referenced only where they touch access.
- SAML, 2FA replay, GraphQL alias brute force, bcrypt 72-byte, WebSocket hijack, Unicode username clones: rare for small apps; not researched here.
- Clerk, Auth0, Better Auth specifics: I did not open their docs today. Their dashboards carry the same checks (email verification, redirect allow lists, rate limits).
- Business logic holes such as unpaid booking holds and slot grids: app-specific, not a standard class.

## Open questions
- **Points often got wrong:** (1) The Next.js fix is often given as just "upgrade"; the vendor says Vercel-hosted deployments were not affected and only self-hosted ones were. (2) `middleware` is now `proxy` in Next.js 16. (3) Supabase leaked-password protection needs Pro or above. (4) Supabase's key names changed to publishable/secret; the old `anon`/`service_role` names still appear in older projects. (5) The "RLS" label does not apply to Firebase: it uses Security Rules.
- Firebase test-mode expiry and "the Firebase rules from deploy" pattern: the pages opened did not state an expiry; check the console.
- Supabase: what exactly happens when a `redirectTo` is not in the allow list (the page does not say; test it).
- Whether plain `supabase-js` keeps sessions in `localStorage` in the browser: not confirmed from the docs read.
- Next.js Server Action Origin check: source is the 2023 blog post about Next.js 14; confirm in the current docs for the installed version.
- Not opened today: Descope nOAuth post, the OWASP JWT cheat sheet (the URL tried returned 404), RFC 8725, Clerk docs.
