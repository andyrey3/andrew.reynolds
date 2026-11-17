# Profile signals: what the code tells you about the app

Build the profile from evidence before asking the user anything. Each row is a thing to look for and what it means for the audit.
Record the file where you saw it. Search the whole repo except `node_modules`, build output and lockfiles unless a row says otherwise.

## Contents
1. Stack and hosting
2. Data and accounts
3. Money
4. Third parties that receive user data
5. Features that widen the audit
6. Legal surface already present
7. The live site
8. The profile block

## 1. Stack and hosting
| Look for | Means |
|---|---|
| `package.json` dependencies: `next`, `react`, `vite`, `@remix-run/*`, `astro`, `expo`, `react-native`, `express`, `fastify`, `hono` | The framework and its version. Note exact versions for the dependency checks |
| `requirements.txt`, `pyproject.toml` (`django`, `flask`, `fastapi`), `Gemfile`, `go.mod`, `composer.json` | A non-JavaScript backend; the same checks apply, the file names differ |
| `vercel.json`, `netlify.toml`, `fly.toml`, `render.yaml`, `Dockerfile`, `wrangler.toml`, `.github/workflows/` | Where it deploys and what runs in CI |
| `next.config.*`, `middleware.ts`, `app/api/**/route.ts`, `pages/api/**`, files starting with `"use server"` | The server surface of a Next.js app: every one of these is reachable from the internet |
| `app.json`, `eas.json`, `ios/`, `android/`, `Info.plist`, `AndroidManifest.xml` | A mobile build: app store rules apply |

## 2. Data and accounts
| Look for | Means |
|---|---|
| `@supabase/supabase-js`, `supabase/migrations/`, `supabase/config.toml`, `createClient(` | Supabase. Find every client creation and which key it uses; read the migrations for tables, policies and `enable row level security` |
| `firebase`, `firebase-admin`, `firestore.rules`, `storage.rules`, `database.rules.json` | Firebase. The rules files are the access control |
| `prisma/schema.prisma`, `drizzle.config.*`, `schema.ts`, `*.sql`, `mongoose`, `mongodb` | The schema. List every table and column that holds personal data (name, email, phone, address, date of birth, payment references, location, photos, free text) |
| `next-auth`, `@auth/*`, `@clerk/*`, `better-auth`, `lucia`, `@supabase/auth-helpers-*`, `@supabase/ssr`, `passport`, `jsonwebtoken`, `jose` | How people log in, and whether sessions are cookies or tokens |
| `role`, `is_admin`, `isAdmin`, `admin` in schema and routes; an `/admin` path | There is a privileged role: find where it is enforced |
| `org_id`, `team_id`, `tenant_id`, `workspace_id` | Multi-tenant data: check isolation between tenants |

## 3. Money
| Look for | Means |
|---|---|
| `stripe`, `@stripe/stripe-js`, `lemonsqueezy`, `@paddle/*`, `paypal`, `revenuecat` | Payments. Find where the amount is set, where checkout is created, and the webhook route |
| `mode: 'subscription'`, `price_`, `recurring`, `trial_period_days`, `trial` | Subscriptions or trials: the billing and cancellation rules apply |
| `credits`, `balance`, `tokens`, `coupon`, `promo`, `referral` columns or routes | A value system that can be abused: check race conditions and replay |
| `webhook` routes | Each one must verify who is calling |

## 4. Third parties that receive user data
Search the root layout, any tag-manager snippet, `<Script` tags and `package.json`.
| Look for | Means |
|---|---|
| `gtag(`, `googletagmanager.com`, `google-analytics.com`, `@next/third-parties`, `@vercel/analytics`, `plausible`, `posthog`, `mixpanel`, `amplitude`, `segment` | Analytics: note whether it loads before any consent, and whether it sets cookies |
| `fbq(`, `connect.facebook.net`, `ttq.`, `analytics.tiktok.com`, `snaptr(`, `linkedin.com/px`, `pinterest` tags, `ads-twitter.com` | Ad pixels: the tracking and wiretap entries apply; note which pages they load on |
| `hotjar`, `fullstory`, `logrocket`, `clarity.ms`, `smartlook`, PostHog session recording, `mouseflow` | Session replay: high lawsuit exposure in some US states |
| `intercom`, `crisp`, `drift`, `tawk`, `zendesk` chat widgets | A third party receiving chat content |
| `openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, `ai` (Vercel AI SDK), `replicate`, `elevenlabs`, `groq` | An AI provider: what user data goes into prompts, and whether the key is server-side |
| `resend`, `@sendgrid/mail`, `postmark`, `nodemailer`, `mailchimp`, `loops`, `klaviyo`, `convertkit` | Email: separate transactional from marketing sends |
| `twilio`, `vonage`, `messagebird`, `sns` publish | SMS or calls: consent rules and SMS-pumping abuse |
| `@sentry/*`, `logtail`, `datadog` | Error and log services that may receive personal data |
| `cloudinary`, `uploadthing`, `@aws-sdk/client-s3`, `@vercel/blob`, Supabase or Firebase storage calls | File storage |
Every vendor on this list is a party to name in a privacy policy and, where the GDPR applies, to have a data processing agreement with.

## 5. Features that widen the audit
| Look for | Means |
|---|---|
| `<input type="file"`, `formData.get(`, `multer`, upload routes | Uploads: file checks apply |
| `dangerouslySetInnerHTML`, `innerHTML`, markdown or rich-text renderers (`react-markdown`, `marked`, `tiptap`, `quill`) | User text rendered as HTML: cross-site scripting checks |
| `fetch(` or `axios` called with a URL taken from the request; link previews; image proxies; "import from URL" | Server-side request forgery checks |
| Reviews, comments, posts, profiles, messages, a public feed | User-generated content: moderation, takedown and impersonation entries |
| `<video`, `mux`, `vimeo`, `youtube` embeds on logged-in pages | Video viewing data: check for pixels on those pages |
| `date_of_birth`, `age`, `grade`, `parent`, `school`, child-oriented copy or art | Minors may be users: the children's entries |
| `health`, `symptom`, `diagnosis`, `medication`, `therapy`, `period`, `weight`, `fitness` | Health data outside HIPAA has its own laws |
| `face`, `selfie`, `voice`, `fingerprint`, `liveness`, camera or microphone capture sent to an API | Biometric data |
| `navigator.geolocation`, `latitude`, `longitude` stored | Precise location |
| `cron`, scheduled functions, `/api/cron`, queue workers | Endpoints that should not be callable by anyone |
| `graphql`, `apollo`, `/graphql` | Introspection, depth and alias limits |
| `.mcp.json`, `mcp` servers, `.claude/`, `.cursor/rules`, agent hooks | AI-agent configuration that ships with the repo |

## 6. Legal surface already present
| Look for | Means |
|---|---|
| Routes or pages named `privacy`, `terms`, `tos`, `legal`, `cookies`, `refund`, `dmca`, `accessibility`, `imprint` | Policies exist: read them and compare with what the code really does (data collected, vendors, retention) |
| A consent banner component, `cookie-consent`, `onetrust`, `cookiebot`, `klaro`, `osano` | Consent exists: check that trackers wait for it |
| A checkbox or text at sign-up linking the terms | How users agree to the terms |
| `unsubscribe`, `List-Unsubscribe`, a postal address in email templates | Email compliance basics |
| Delete-account and export-data routes or settings | Whether user rights can be met in the product |
| `navigator.globalPrivacyControl`, `Sec-GPC` | Whether the opt-out signal is read |
| `LICENSE`, font files in `public/`, stock images, `package.json` licences | What the app is built from |

## 7. The live site (only with the user's OK)
One plain request each; nothing here is an attack.
- Response headers on the home page: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options` or `frame-ancestors`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Access-Control-Allow-Origin`.
- Whether `/.env`, `/.git/config`, `/api/docs`, `/graphql`, and a `.map` file next to a script return 200.
- Which third-party requests and cookies fire on first load, before any consent click.
- The built JavaScript, searched for key prefixes (`sk_live_`, `sk_test_`, `service_role`, `sk-`, `AIza`, `AKIA`).

## 8. The profile block
Put this at the top of the report and hand it to any subagent.
```
App: <name>, <one line on what it does>
Stack: <framework + version> · <hosting> · <database> · <auth> · <payments> · <AI>
Server surface: <N> API routes, <N> server actions, middleware <yes/no>
Personal data held: <list, with the table or collection>
Sent to third parties: <vendor: what data>
Money: <one-off | subscription | credits | none>, live keys <yes/no/unknown>
Users: <where> · <how many> · minors <no | possible | yes> · sensitive data <none | which>
Owner: <individual | company>, <country or state>
Live URL: <url or "not deployed">, live checks allowed <yes/no>
Assumed (not confirmed): <list>
```
