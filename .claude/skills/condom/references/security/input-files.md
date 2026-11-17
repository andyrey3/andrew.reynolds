# Security: what users send in (INPUT) and the files they upload (FILE)

Scope: every place a stranger's text, URL, header or file reaches your server or other users' browsers. Written for a Next.js (App Router) + Supabase + Vercel app first; the checks work on any stack. Every quote below was read at the source on 2026-11-16. A hole is only a finding once the "Prove it" step shows it on the owner's own running app. Never test someone else's app. Entries sit worst-and-most-common first.

## Contents
| ID | Plain name |
|---|---|
| SEC-INPUT-01 | Login link that forwards to another website (open redirect) |
| SEC-FILE-01 | Uploads with no type, size or content check |
| SEC-FILE-02 | SVG or HTML upload served from your own site (stored XSS) |
| SEC-FILE-03 | Private files in a public bucket, or guessable file URLs |
| SEC-INPUT-02 | User text shown as raw HTML (XSS) |
| SEC-INPUT-03 | Search box that can add its own filters (Supabase `.or()` filter injection) |
| SEC-INPUT-04 | Database query built from strings (SQL injection) |
| SEC-INPUT-05 | Database function that anyone can call and that builds SQL (`.rpc`, security definer) |
| SEC-INPUT-06 | Your server fetches a URL the user typed (SSRF) |
| SEC-INPUT-07 | A user-supplied link that runs code (`javascript:` href) |
| SEC-INPUT-08 | Reset link built from the Host header |
| SEC-FILE-04 | Location left inside user photos (EXIF) |
| SEC-FILE-05 | User files served with the wrong content type |
| SEC-FILE-06 | Giant images and zip bombs |
| SEC-FILE-07 | Photo or file path chosen by the browser |
| SEC-INPUT-09 | `../` in a filename or URL (path traversal) |
| SEC-INPUT-10 | User text reaching a shell (command injection) |
| SEC-INPUT-11 | User text inside a template (server-side template injection) |
| SEC-INPUT-12 | Mongo or Firestore-style queries built from request JSON (NoSQL injection) |
| SEC-INPUT-13 | Merging request JSON into objects (prototype pollution) |
| SEC-INPUT-14 | XML from users (XXE) |
| SEC-INPUT-15 | Spreadsheet export that runs formulas (CSV injection) |
| SEC-INPUT-16 | Lookalike usernames (Unicode) |
| SEC-INPUT-17 | Proxy and cache tricks (request smuggling, cache poisoning) |

---

### SEC-INPUT-01 · Login link that forwards to another website (open redirect)
- **Applies when:** a login, logout, checkout or magic-link route reads a `next`, `redirect`, `returnTo` or `redirect_to` value and sends the user there. Supabase auth `emailRedirectTo` and OAuth callback routes are the usual spots.
- **What goes wrong:** a link on your real domain bounces the user to a phishing page. One audit of two AI-built restaurant sites found this on both ("Login link that forwards to another website", medium on both), where the check only looked at the start of the string. A string-prefix check is beaten by `//evil.com` or `https://yoursite.com.evil.com`.
- **Find it:** 1. Search `searchParams.get('next')`, `redirect_to`, `returnTo`, `callbackUrl`, `NextResponse.redirect(`, `redirect(` (from `next/navigation`), `router.push(` fed by a query value. 2. Open `app/auth/callback/route.ts` and any login action. 3. Bad: the value is used after `startsWith('/')`, `includes(`, or no check at all. 4. In Supabase dashboard, Authentication > URL Configuration: a wildcard like `https://*` or a `localhost` entry left in production is a related hole.
- **Prove it:** on the owner's own deployment open `https://<site>/login?next=//example.com` (and `next=https://example.com`), log in with a test account, and see whether the browser lands on example.com. Harmless.
- **Fix:** do not take the destination from the request. Map a short key to a fixed path on the server, or accept only a relative path: parse with `new URL(value, origin)`, require `url.origin === origin` and a path that starts with a single `/`, otherwise use `/`. Tighten the Supabase redirect allow-list to exact URLs. **Who:** Claude (Supabase URL list: owner).
- **Severity:** medium, it makes phishing look trustworthy.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html · "Simply avoid using redirects and forwards." · read 2026-11-16

### SEC-FILE-01 · Uploads with no type, size or content check
- **Applies when:** any file input (avatar, review photo, document, attachment), including a Supabase Storage upload called straight from the browser.
- **What goes wrong:** anyone can store a script, a huge file or an unexpected format, then link to it from your domain. The browser-side `accept=` attribute stops nobody.
- **Find it:** 1. Search `type="file"`, `.upload(`, `createSignedUploadUrl`, `formData.get('file')`, `multer`, `formidable`. 2. For each, look for a server or bucket rule on size, extension AND the real bytes. 3. In Supabase (Storage > the bucket > Edit) check "Restrict file upload size" and "Allowed MIME types"; empty means anything goes. 4. Bad: the code trusts `file.type` (sent by the browser) or the filename extension.
- **Prove it:** with a test account, rename a small `.html` or `.txt` file to `photo.png`, upload it, and see whether it is accepted; then upload a file larger than you intend to allow. Delete both after.
- **Fix:** set `allowedMimeTypes` and `fileSizeLimit` on every bucket (`createBucket` options, or the bucket's settings page). On the server check the first bytes of the file (magic bytes), re-encode images (see FILE-04), generate the filename yourself, and let only signed-in users upload. **Who:** Claude (bucket settings by SQL or dashboard: both).
- **Severity:** high, a missing check turns every other upload risk on.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html · "Validate the file type, don't trust the Content-Type header as it can be spoofed" · read 2026-11-16. Bucket limits: https://supabase.com/docs/guides/storage/buckets/creating-buckets · "When creating a bucket you can add additional configurations to restrict the type or size of files" · read 2026-11-16

### SEC-FILE-02 · SVG or HTML upload served from your own site (stored XSS)
- **Applies when:** users can upload images and you allow SVG (or any `text/html`), or you proxy user files through your own domain (`/api/files/...`, `next/image` on a user URL).
- **What goes wrong:** an SVG is a web page that can carry script. Opened from your origin, it runs as your site and can read the viewer's session. Next.js's own image docs warn about it.
- **Find it:** 1. Search the bucket settings and upload code for `image/svg+xml`, `.svg`, `text/html`. 2. In `next.config.*` look for `dangerouslyAllowSVG: true` (default is false). 3. Check whether user files are served from your app's domain or from a storage subdomain. 4. Bad: SVG allowed with no `Content-Security-Policy: sandbox` and no forced download.
- **Prove it:** upload a harmless SVG with `<script>document.title='x'</script>` to your own app, open its URL directly, and see whether the tab title changes. Delete it.
- **Fix:** drop SVG from the allowed types, or re-draw it to PNG on the server. If you must keep SVG: serve from a separate domain, send `Content-Disposition: attachment` and a `sandbox` CSP. For `next/image` set `contentDispositionType: 'attachment'` and `contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"`. **Who:** Claude.
- **Severity:** high, runs attacker code on your domain.
- **Source:** https://nextjs.org/docs/app/api-reference/components/image · "SVG has many of the same features as HTML/CSS, which can lead to vulnerabilities" · read 2026-11-16

### SEC-FILE-03 · Private files in a public bucket, or guessable file URLs
- **Applies when:** Supabase Storage, Firebase Storage or S3 holds anything personal (ID photos, receipts, medical files, private photos).
- **What goes wrong:** a public bucket serves any file to anyone who has the URL. Tea's leak (about 72,000 images, incl. ~13,000 selfies and photo IDs) is the well-known case. Sequential or short IDs in the path let people count their way through other users' files.
- **Find it:** 1. Supabase: Storage, look for buckets marked Public; or SQL `select id, name, public from storage.buckets;`. 2. Search code for `getPublicUrl(`; each hit is a file anyone can fetch. 3. List `storage.objects` policies: `select * from pg_policies where schemaname='storage';` and look for `using (true)` or no owner check. 4. Firebase: `storage.rules` with `allow read: if true`. 5. Bad: paths like `uploads/1.jpg` or `userId/avatar.png` that are public.
- **Prove it:** open an uploaded file's URL in a private window with no login. If it loads, anyone can see it. Also try `.../object/public/<bucket>/` with a neighbouring name.
- **Fix:** make the bucket private (the default), read through `createSignedUrl` with a short expiry or an RLS policy scoped to the owner (`(storage.foldername(name))[1] = auth.uid()::text`), and use random UUIDs for names. Public is fine only for content you would put on a billboard (avatars the user chose to show). **Who:** both (data already exposed: owner decides on notifying people, see the legal files).
- **Severity:** critical for personal files, otherwise low; whole-database leak risk.
- **Source:** https://supabase.com/docs/guides/storage/buckets/fundamentals · "anyone who possesses the asset URL can readily access the file" · read 2026-11-16.

### SEC-INPUT-02 · User text shown as raw HTML (XSS)
- **Applies when:** React `dangerouslySetInnerHTML`, `innerHTML`, a markdown or rich-text renderer with HTML enabled (`rehype-raw`, `marked` without a sanitizer, `html: true`), or emails and PDFs built from user text.
- **What goes wrong:** a script planted in a review, bio or comment runs in every visitor's browser and can steal the session. React escapes normal text by default; the holes are the escape hatches.
- **Find it:** 1. Search `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, `v-html`, `rehype-raw`, `allowDangerousHtml`, `html: true`, `marked(`. 2. For each, trace where the string comes from: user, database, AI model output, third-party API. 3. Bad: no `DOMPurify.sanitize(` (or equivalent) between source and sink.
- **Prove it:** on your own app submit `<img src=x onerror=document.title='xss'>` as a review or bio and view it as another account. If the title changes, it is exploitable. Remove the test row after.
- **Fix:** render as text. If HTML is required, sanitize with DOMPurify on the final string and restrict tags; turn off raw HTML in the markdown renderer. Add a Content-Security-Policy (see SEC-DEPLOY-01 in the deploy file) as a second layer. Keep session tokens in httpOnly cookies. **Who:** Claude.
- **Severity:** high, steals accounts of other users.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html · "OWASP recommends DOMPurify for HTML Sanitization." · read 2026-11-16

### SEC-INPUT-03 · Search box that can add its own filters (Supabase `.or()` filter injection)
- **Applies when:** supabase-js `.or(...)`, `.filter(...)`, `.ilike(...)` strings built with a template literal from user text, e.g. `.or(\`name.ilike.%${q}%,email.ilike.%${q}%\`)`. Also direct PostgREST URLs (`/rest/v1/...?or=(...)`).
- **What goes wrong:** `.or()` takes a comma-and-parenthesis filter string. Input containing `,` or `)` adds extra conditions (for example `x,role.eq.admin`), so a search box can widen the query beyond what you meant. RLS still applies, so the damage is bounded by your policies: the hole is worst where RLS is loose or the query runs with the service role key. This entry is my reasoning from PostgREST's syntax; no vendor advisory names it.
- **Find it:** 1. Search `.or(`, `.filter(`, `.not(` and `\${` on the same line or `+ ` string joins in files under `app/`, `lib/`, `actions/`. 2. Bad: user text inside the filter string. 3. Check the client: `createClient(url, SERVICE_ROLE_KEY)` in a route that searches is much worse.
- **Prove it:** search your own app for `a,id.neq.0`; if you get rows that do not match `a` the string was spliced in.
- **Fix:** prefer chained methods with separate arguments (`.ilike('name', \`%${q}%\`)` and `.in()`), which are sent as values not syntax. If `.or()` is needed, strip `,()"` from the input or wrap the value in double quotes with inner quotes escaped. Never use the service role key for search. **Who:** Claude.
- **Severity:** medium, bounded by RLS.
- **Source:** https://docs.postgrest.org/en/stable/references/api/tables_views.html · "If the filter value has a reserved character, then you need to wrap it in double quotes" · read 2026-11-16

### SEC-INPUT-04 · Database query built from strings (SQL injection)
- **Applies when:** `pg`, `postgres`, `mysql2`, Prisma `$queryRawUnsafe` / `$executeRawUnsafe`, Drizzle `sql.raw()`, Knex `raw()`, SQLAlchemy `text(f"...")`, or any template literal that puts a variable inside SQL. Plain supabase-js query builders and ORM query methods are parameterised.
- **What goes wrong:** the input closes a quote and appends its own SQL; it can read or change every table the database user can reach.
- **Find it:** 1. Search `queryRawUnsafe`, `executeRawUnsafe`, `sql.raw`, `.raw(`, `query(\``, `query("... " +`, and backticks containing `SELECT|INSERT|UPDATE|DELETE|WHERE`. 2. Bad: `${` or `+` inside the SQL text. Prisma's tagged `$queryRaw\`...${x}\`` is safe; the `Unsafe` variants and `$queryRaw(string)` are not. 3. Dynamic column or table names and `ORDER BY` from the request are injectable even with bound values.
- **Prove it:** code only. A single `'` typed into the field that feeds the query returning a 500 is a hint; read the code before concluding.
- **Fix:** bind values as parameters (`$1`, `?`); choose column, table and sort order from a fixed server-side list; give the app's database role the least privilege. **Who:** Claude.
- **Severity:** critical, whole-database read or write.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html · "A SQL injection attack occurs when untrusted data (usually strings) becomes part of a query's SQL syntax, modifying the logic of the SQL request." · read 2026-11-16

### SEC-INPUT-05 · Database function anyone can call that builds SQL (`.rpc`, security definer)
- **Applies when:** Supabase Postgres functions in the `public` schema (callable as `supabase.rpc('name', args)` by any logged-in or even logged-out visitor).
- **What goes wrong:** Row-level security does not apply to functions. A `security definer` function runs with its owner's rights and bypasses RLS, so a function that takes user text and runs `execute format(...)` with it, or returns rows without checking `auth.uid()`, hands out data. In one audit of two AI-built sites, the fix for the critical hole was the reverse: priced database functions instead of open insert policies.
- **Find it:** 1. In `supabase/migrations/*.sql` or `schema.sql` search `security definer`, `execute format(`, `execute '`, `|| ` inside `execute`. 2. SQL: `select proname, prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public';` 3. `select routine_name, grantee from information_schema.routine_privileges where routine_schema='public' and grantee in ('anon','authenticated','PUBLIC');` Bad: `anon` can execute a definer function, no `auth.uid()` check inside, or `search_path` not pinned.
- **Prove it:** while logged out, call `supabase.rpc('<name>', {...})` from a scratch script with the anon key against your own project and see whether it returns data.
- **Fix:** `revoke execute on function ... from public, anon;` grant only to `authenticated` where needed; prefer `security invoker`; add `set search_path = ''`; use `format('%I', col)` and `%L` or fixed lists instead of concatenation; check `auth.uid()` inside. **Who:** Claude writes the migration, owner applies it to production.
- **Severity:** high, skips every row policy.
- **Source:** https://supabase.com/docs/guides/api/securing-your-api · "RLS doesn't apply to functions, so grant `execute` only to the roles that need to call them. Review every `security definer` function carefully." · read 2026-11-16

### SEC-INPUT-06 · Your server fetches a URL the user typed (SSRF)
- **Applies when:** link previews, "import from URL", webhooks the user configures, image proxies, PDF/screenshot makers, AI tools that browse, Next.js `images.remotePatterns` with a wide pattern, `rewrites()` / `redirects()` whose destination host comes from the request.
- **What goes wrong:** the user points your server at `http://169.254.169.254/` (cloud metadata) or an internal address and your server returns what it finds. On Vercel the metadata address is not your main exposure; your own internal APIs, other users' private URLs and cloud keys in other hosts are. Next.js itself shipped several: image optimizer SSRF (CVE-2026-94483, High, if `remotePatterns` is set) and rewrite SSRF (CVE-2026-64645, High).
- **Find it:** 1. Search `fetch(` / `axios` / `got(` / `undici` whose URL argument traces to `req.body`, `searchParams`, a database column the user set. 2. Open `next.config.*`: `images.remotePatterns` with `hostname: '**'`, and any `rewrites()` with `${` or `:param` in the destination host. 3. Bad: no allow-list, redirects followed, no block on private ranges.
- **Prove it:** in your own app submit `http://127.0.0.1:3000/api/health` or a request-catcher URL you control as the "URL" and see whether your server fetched it.
- **Fix:** match the host against an allow-list, build the request yourself, turn off redirect-following, resolve the DNS name and refuse private and link-local ranges (127.0.0.0/8, 10/8, 172.16/12, 192.168/16, 169.254/16, ::1, fc00::/7) at connect time (an allow-list alone loses to DNS rebinding). Narrow `remotePatterns` to exact hosts. Update Next.js (see SEC-SUPPLY-02). **Who:** Claude.
- **Severity:** high, reaches things behind your firewall.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html · "Match the host against an allowlist, and build the request yourself." · read 2026-11-16. Next.js: https://nextjs.org/blog/september-2026-security-release · "If no `images.remotePatterns` are configured, your application is not affected." · read 2026-11-16

### SEC-INPUT-07 · A user-supplied link that runs code (`javascript:` href)
- **Applies when:** a profile "website" field, link field in a review or post, or any `<a href={user.url}>` / `<Link href>` / `window.location = value`.
- **What goes wrong:** `javascript:alert(1)` in the href runs script when clicked, as your site. React 19 blocks it in `href` and `src`, but OWASP says that does not replace your own validation; older React, `window.location`, `redirect` targets and non-React code still run it.
- **Find it:** 1. Search `href={` with a user-controlled value, `window.location`, `location.href =`, `target="_blank"` without `rel="noopener noreferrer"`. 2. Check the form and API: is the scheme validated?
- **Prove it:** save `javascript:alert(document.domain)` as your own profile website and click it as another test account.
- **Fix:** validate on the server: `new URL(v)` then require `protocol` in `['http:', 'https:']` (add `mailto:` if wanted); store only the validated string. **Who:** Claude.
- **Severity:** medium, needs a click.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html · "React 19 blocks `javascript:` URLs in `src` and `href`, but this does not replace application-specific URL validation." · read 2026-11-16

### SEC-INPUT-08 · Reset link built from the Host header
- **Applies when:** you send your own password-reset, invite or verification emails and build the link from `req.headers.host`, `x-forwarded-host`, `request.url` or `new URL(req.url).origin`. Supabase's hosted auth emails use the configured Site URL, so they are not affected; custom Resend or SendGrid emails are.
- **What goes wrong:** the attacker changes the Host header on the reset request, so the email to the victim carries a link to the attacker's domain and the reset token is delivered to it.
- **Find it:** 1. Search `headers().get('host')`, `x-forwarded-host`, `req.headers.host`, `origin` near `resetPassword`, `generateLink`, `sendEmail`. 2. Bad: the link base comes from the request. Good: `process.env.NEXT_PUBLIC_SITE_URL`.
- **Prove it:** code only; do not send forged reset mail to real users.
- **Fix:** put the canonical origin in an environment variable and build every emailed link from it. **Who:** Claude.
- **Severity:** high, account takeover.
- **Source:** https://portswigger.net/web-security/host-header/exploiting/password-reset-poisoning · "Password reset poisoning is a technique whereby an attacker manipulates a vulnerable website into generating a password reset link pointing to a domain under their control." · read 2026-11-16

### SEC-FILE-04 · Location left inside user photos (EXIF)
- **Applies when:** you store and show photos from phones (avatars, reviews, listings, ID photos).
- **What goes wrong:** phone photos carry GPS position, device and time in EXIF. Shown as-is, they publish where a user lives or was.
- **Find it:** 1. Check the upload path for any image re-encode step (`sharp(...).rotate().toFormat(...)` without `.withMetadata()`; Canvas redraw). Sharp strips metadata by default unless `withMetadata` is called. 2. Bad: the original bytes are stored and served unchanged.
- **Prove it:** take a phone photo with location on, upload it to your own app, download the stored file and run `exiftool file.jpg | grep -i gps` (or open its Properties, Details tab).
- **Fix:** decode and re-encode every image server-side before storing, with metadata dropped (keep orientation by calling `.rotate()` first). **Who:** Claude. Whether a location leak is also a privacy-law problem: see the legal files.
- **Severity:** medium, reveals home or movement.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html · "decode and re-encode to an allowed image format, explicitly removing unnecessary metadata" · read 2026-11-16

### SEC-FILE-05 · User files served with the wrong content type
- **Applies when:** you serve user uploads through your own route handler, or a bucket stores files with whatever type the uploader sent.
- **What goes wrong:** a browser may guess ("sniff") that a file labelled as text or an image is really HTML and run it. MDN: `nosniff` prevents this attack where user-uploaded content is run as an HTML document.
- **Find it:** 1. Search routes that stream files (`new Response(blob`, `NextResponse(file`, `res.send(`) and see which `Content-Type` they set (from the user's `file.type` is bad). 2. `curl -I <file-url>` on a stored upload: look for the right `content-type`, `x-content-type-options: nosniff`, and `content-disposition: attachment` for anything that is not an image.
- **Prove it:** the `curl -I` above on your own file URL.
- **Fix:** set `Content-Type` from your own server-side detection of the bytes, add `X-Content-Type-Options: nosniff`, force download (`Content-Disposition: attachment`) for non-images, and serve user files from a separate domain when you can. **Who:** Claude.
- **Severity:** medium, only matters with a lax upload.
- **Source:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options · "This prevents XSS-attacks where user-uploaded content is executed as an HTML document" · read 2026-11-16

### SEC-FILE-06 · Giant images and zip bombs
- **Applies when:** you resize, thumbnail, unzip or parse uploads, or use `next/image` on remote images (self-hosted).
- **What goes wrong:** a tiny file that expands to gigabytes, or a 20,000-pixel image, eats the server's memory and CPU or runs up your function bill. Next.js has patched image-optimizer CPU exhaustion from crafted SVGs (CVE-2026-64644, Medium).
- **Find it:** 1. Look for `sharp(`, `jimp`, `unzipper`, `adm-zip`, `JSZip`, `extract(`. 2. Bad: no cap on pixel dimensions (`sharp(..., { limitInputPixels })`), no cap on extracted size, no `fileSizeLimit` on the bucket. 3. Vercel function body is capped by the platform, but a direct-to-Supabase upload has only your bucket limit.
- **Prove it:** upload a file just above your intended limit and confirm it is rejected. Do not build a bomb.
- **Fix:** cap file size at the edge (bucket `fileSizeLimit`), pixels (`limitInputPixels`), request body size, and total extracted size after decompression. **Who:** Claude.
- **Severity:** medium, cost and outage.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html · "If the system is going to extract the files or process them, the file size limit should be considered after file decompression is conducted" · read 2026-11-16

### SEC-FILE-07 · Photo or file path chosen by the browser
- **Applies when:** a review, profile or post saves a storage path or URL that the browser sends (`photo_path`, `image_url`, `avatar`).
- **What goes wrong:** a user points their review at another user's private file, an internal path, or an off-site tracking image. One audit's fix list says "restrict photo paths" for the fake-reviews hole.
- **Find it:** 1. Search insert and update code for columns named `*_path`, `*_url`, `image`, `avatar`, `photo`. 2. Check the RLS policy or server action: does it require the path to start with `auth.uid()/` and the object to exist in your own bucket? 3. Bad: any string accepted.
- **Prove it:** as a test account, submit a review whose photo path points at another test account's folder.
- **Fix:** accept only a file id your server issued; check with a policy such as `check ((storage.foldername(photo_path))[1] = auth.uid()::text)`; reject absolute URLs. **Who:** Claude.
- **Severity:** medium, leaks or abuses other files.
- **Source:** an audit of two AI-built sites (2026-11), unpublished (no outside source) · "take review names from the profile, restrict photo paths, limit reviews per customer" · read 2026-11-16

### SEC-INPUT-09 · `../` in a filename or URL (path traversal)
- **Applies when:** code builds a file path from user input: `fs.readFile(path.join(dir, name))`, download routes (`/api/download?file=`), template or language file loaders, `sendFile`, static-file middleware on a self-hosted server.
- **What goes wrong:** `../../.env` steps out of the folder and returns your server's files, including secrets and source.
- **Find it:** 1. Search `readFile`, `createReadStream`, `path.join(`, `path.resolve(`, `sendFile`, `fs.` with a request value. 2. Bad: no check that the final resolved path still starts with the intended directory.
- **Prove it:** on your own dev copy request `/api/download?file=../../package.json`.
- **Fix:** do not use user input in paths; use an id mapped to a file; or `const full = path.resolve(base, name); if (!full.startsWith(base + path.sep)) reject`. Serve user files from object storage. **Who:** Claude.
- **Severity:** high, secrets and source readable.
- **Source:** https://owasp.org/www-community/attacks/Path_Traversal · "aims to access files and directories that are stored outside the web root folder" · read 2026-11-16

### SEC-INPUT-10 · User text reaching a shell (command injection)
- **Applies when:** `child_process.exec` / `execSync` / `spawn(..., { shell: true })`, Python `os.system`, `subprocess(..., shell=True)`, `eval`, `new Function`. Common in AI-built apps that call `ffmpeg`, `convert`, `git` or `curl`.
- **What goes wrong:** `; rm -rf` or `$(curl evil|sh)` in a filename or field runs on your server.
- **Find it:** 1. Search the names above. 2. Bad: a string built with `${}` or `+` and passed as one command line.
- **Prove it:** code only.
- **Fix:** avoid shelling out; use the library. If you must, `execFile('ffmpeg', [args])` (no shell) with an allow-list for options. **Who:** Claude.
- **Severity:** critical, full server control.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html · "avoid calling OS commands directly" · read 2026-11-16

### SEC-INPUT-11 · User text inside a template (server-side template injection)
- **Applies when:** you assemble a template string from user input and then render it: Handlebars/EJS/Pug/Nunjucks `compile(userText)`, email or PDF templates users can edit, `eval` of a template literal. Next.js JSX and React are not affected by normal use.
- **What goes wrong:** the input runs as template code on the server. PortSwigger's test is `${7*7}` coming back as 49.
- **Find it:** 1. Search `ejs.render(`, `Handlebars.compile(`, `nunjucks.renderString(`, `pug.compile(`, `new Function(`. 2. Bad: the template text itself contains user input, rather than passing it as data.
- **Prove it:** put `${7*7}` and `{{7*7}}` in the field and see whether 49 appears.
- **Fix:** pass user input only as variables; use a logic-less or sandboxed engine for user-written templates. **Who:** Claude.
- **Severity:** critical, code runs on server.
- **Source:** https://portswigger.net/web-security/server-side-template-injection · "an attacker can potentially achieve remote code execution, taking full control of the back-end server" · read 2026-11-16

### SEC-INPUT-12 · Mongo or Firestore-style queries built from request JSON (NoSQL injection)
- **Applies when:** MongoDB / Mongoose with `find(req.body)` or `find({ email: req.body.email })`, or any JSON body passed straight into a query. Supabase and Firestore client queries are less exposed, but Firestore rules that read `request.resource.data` unchecked are the same class.
- **What goes wrong:** the client sends `{"password": {"$ne": ""}}` instead of a string and logs in without the password.
- **Find it:** 1. Search `.find(req.body`, `findOne({ ...req.body`, `$where`, `$regex` from input. 2. Bad: no schema check that fields are strings.
- **Prove it:** on your dev copy post `{"email":"a@b.c","password":{"$ne":""}}` to login.
- **Fix:** validate every body with a schema (Zod) that demands strings; cast with `String(x)`; strip keys that start with `$`; never use `$where`. **Who:** Claude.
- **Severity:** high, login bypass.
- **Source:** https://portswigger.net/web-security/nosql-injection · "NoSQL injection is a vulnerability where an attacker is able to interfere with the queries that an application makes to a NoSQL database" · read 2026-11-16

### SEC-INPUT-13 · Merging request JSON into objects (prototype pollution)
- **Applies when:** a Node server deep-merges or assigns request bodies (`lodash.merge`, `_.set`, `Object.assign` in a loop, a hand-written recursive merge).
- **What goes wrong:** a body with `__proto__` changes every object in the process, giving privilege flags or, in bad cases, code execution.
- **Find it:** 1. Search `merge(`, `defaultsDeep`, `_.set(`, `JSON.parse` followed by a recursive copy. 2. Run `npm audit` and look for lodash and similar.
- **Prove it:** on your dev copy post `{"__proto__":{"polluted":true}}` and check `({}).polluted` in the handler.
- **Fix:** validate bodies against a schema that lists allowed keys; block `__proto__`, `constructor`, `prototype`; use `Object.create(null)` or `Map` for user-keyed data. **Who:** Claude.
- **Severity:** medium, high if chained to code paths.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html · "Prototype Pollution is a critical vulnerability that can allow attackers to manipulate an application's JavaScript objects and properties" · read 2026-11-16

### SEC-INPUT-14 · XML from users (XXE)
- **Applies when:** you parse XML from users: SVG or Office uploads processed server-side, RSS import, SAML, sitemap import. Next.js apps that only use JSON are not exposed.
- **What goes wrong:** an XML file points an "external entity" at a file or internal URL and the parser pastes it into the result.
- **Find it:** 1. Search `xml2js`, `fast-xml-parser`, `libxmljs`, `DOMParser` on the server, `lxml`, `defusedxml`. 2. Bad: parser with DTD or external entity processing on (libxmljs `noent: true`).
- **Prove it:** code only.
- **Fix:** turn off DTDs and external entities in the parser; use a library that refuses `DOCTYPE`. **Who:** Claude.
- **Severity:** high where it applies, otherwise not applicable.
- **Source:** https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html · "XML External Entity (XXE) injection occurs when an XML processor resolves an external entity from untrusted input." · read 2026-11-16

### SEC-INPUT-15 · Spreadsheet export that runs formulas (CSV injection)
- **Applies when:** an admin or user can export user-entered data to CSV or XLSX (orders, sign-ups, reviews) and it is opened in Excel or Sheets.
- **What goes wrong:** a name like `=HYPERLINK(...)` becomes a formula in the staff member's spreadsheet.
- **Find it:** 1. Search `text/csv`, `json2csv`, `papaparse.unparse`, `exceljs`. 2. Bad: no handling of cells starting with `=`, `+`, `-`, `@`.
- **Prove it:** save `=1+2` as your own name, export, open in Excel: a cell showing `3` proves it.
- **Fix:** prefix cells that start with `=`, `+`, `-`, `@` with a tab inside quotes (OWASP's Excel-resistant form) or an apostrophe, and quote every field. **Who:** Claude.
- **Severity:** low, needs staff to open the file.
- **Source:** https://owasp.org/www-community/attacks/CSV_Injection · "any cells starting with = will be interpreted by the software as a formula" · read 2026-11-16

### SEC-INPUT-16 · Lookalike usernames (Unicode)
- **Applies when:** usernames, emails or handles allow Unicode and you compare or normalise them in more than one place (sign-up, login, reset, search).
- **What goes wrong:** `ᴮᴵᴳᴮᴵᴿᴰ` normalised to `bigbird`, so Spotify's password reset for the lookalike set the real account's password (2013).
- **Find it:** 1. Search `toLowerCase()`, `normalize(`, `ilike`, unique indexes on `username`/`email` and see if rules differ between sign-up and lookup. 2. Bad: unique check on raw text, lookup on lower-cased text.
- **Prove it:** register a second test user whose name differs only by a fullwidth or small-capital letter.
- **Fix:** normalise once (NFKC, lower-case) at sign-up, store and compare only that form, add a unique index on it, reject names that change when normalised again; limit usernames to a plain character set. **Who:** Claude.
- **Severity:** medium, account takeover in rare setups.
- **Source:** https://engineering.atspotify.com/2013/06/creative-usernames/ · "the new password was instead set for the ‘bigbird’ account" · read 2026-11-16

### SEC-INPUT-17 · Proxy and cache tricks (request smuggling, cache poisoning)
- **Applies when:** only if you run your own reverse proxy / CDN in front of a self-hosted app (nginx, HAProxy, Cloudflare in front of a VPS) or cache HTML at a CDN while reading headers like `X-Forwarded-Host`. Apps purely on Vercel or Netlify are covered by the platform for the HTTP-framing part; app-level cache bugs in Next.js still happen (see SEC-SUPPLY-02).
- **What goes wrong:** the proxy and server disagree where a request ends, so a hidden second request is smuggled; or an unkeyed header changes a cached page that everyone then gets. Next.js patched both kinds in 2026 (cross-client response injection behind a pipelining HTTP/1.1 proxy, GHSA-pc58-hwjq-p385; self-hosted ISR cache poisoning, CVE-2026-94543).
- **Find it:** 1. Ask the owner whether a proxy sits in front of the app. 2. Search `x-forwarded-host`, `x-forwarded-proto`, `Cache-Control: public`, `s-maxage` on pages that vary by header or cookie. 3. Check `next start` / `output: 'standalone'` deployments on a VPS.
- **Prove it:** code and config review only. Do not send smuggling payloads.
- **Fix:** build URLs from configuration, not headers; add every header the app reads to the cache key or strip it; HTTP/2 end to end; keep Next.js and the proxy patched; never cache responses that vary by user. **Who:** both.
- **Severity:** medium, high on self-hosted setups.
- **Source:** https://portswigger.net/web-security/web-cache-poisoning · "manipulation of unkeyed inputs" · read 2026-11-16. Smuggling: https://portswigger.net/web-security/request-smuggling · "the front-end and back-end servers process the request differently" · read 2026-11-16

## Not covered here
- Auth, sessions, RLS policy design, rate limits, webhooks and payments: other reference files.
- Security headers, dev servers, source maps, dependencies and CI: the deploy-supply file.
- HTTP/2 Rapid Reset, JWT algorithm confusion, regex denial of service, timing attacks, padding oracles, WebSocket hijacking, SAML, GraphQL aliases (except those above): crypto and auth files own these.
- AI prompt injection: the AI-features file owns it.
- The legal side of EXIF, UGC and takedowns: legal files.

## Open questions
- SEC-INPUT-03: no vendor advisory describes supabase-js `.or()` injection; the entry rests on PostgREST's filter syntax and should be run once against a real project before the skill states it as fact.
- SEC-FILE-04: the claim that sharp drops metadata unless `withMetadata()` is called comes from my memory of its docs; verify at sharp.pixelplumbing.com before shipping the entry.
- SEC-INPUT-05: pinning `search_path` for definer functions is Supabase/Postgres practice I did not re-open at the source today.
- Next.js release pages print `npm install next@16.4.5 # for 16.5` in the November post (apparent typo for 16.4); confirm the version line before quoting.
