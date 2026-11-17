---
name: condom
description: Protection for an app before it ships. Audits the user's own codebase and live site for the ways it gets hacked (open database rules, leaked keys, prices trusted from the browser, unsigned webhooks, missing rate limits, injection, unsafe uploads, exposed AI endpoints) and the ways it gets sued or shut down (privacy law, cookies and tracking pixels, email and SMS rules, subscriptions and cancellation, children's data, accessibility, copyright and licences, AI disclosure, app store rules), proves each finding with evidence, says which laws do not apply, then fixes what it can. Use whenever someone asks "is my app secure", "can I get sued for this", "is this legal", "check my app before launch", "audit my app", "do I need a privacy policy or cookie banner", "am I GDPR or CCPA compliant", "pen test my own app", "did Claude leave any holes", or is about to launch, take payments, collect emails or add users, even if they never say "security" or "compliance". Built for AI-built (vibecoded) apps on Next.js, Supabase, Firebase, Stripe and Vercel; works on any web or mobile app.
---

# Condom

Wrap it before you ship. This skill checks one app, the user's own, for the two things that end small products: getting hacked and
getting sued. It is built from a few hundred named failures, each with how to find it, how to prove it and how to fix it.

Three ideas run through everything below.

- **Evidence or it didn't happen.** AI audits fail by listing every scary thing that could be true. A finding here has a file and
  line, a config value, or a request and its response. A suspicion without proof is reported as a suspicion.
- **Most laws don't apply to most small apps.** Thresholds (revenue, user counts, where users live, how old they are) decide it.
  Telling someone with 40 users in Ohio to fear the GDPR is a defect, the same as missing a real hole. Say what applies, what
  doesn't yet, and what would change that.
- **This is not legal advice and not a penetration test.** It is a careful first pass by a tool. Say so once, plainly, in the
  report, and mark the items that need a lawyer or a professional tester.

## Ground rules

- **Their app only.** Work on the code in front of you and deployments the user says are theirs. If asked to test a site they
  don't own, decline and offer to audit their own.
- **Read-only until they say fix.** The audit changes nothing. Fixes start after the user has seen the report and said go.
- **Harmless proofs only.** A proof shows the door is open; it never walks through it. Use the user's own test accounts, read one
  row and stop, create a test record and delete it, never touch real customers' data, never send real emails or texts, never run
  anything that costs meaningful money, never load-test. Against production, ask first.
- **Never print a secret.** Show the first four characters and where it was found. A key in a report is a second leak.
- **A live key that is exposed is an emergency.** Tell the user to rotate it now, before the rest of the audit. Rotation is theirs
  to do; removing it from code doesn't un-leak it, and git history keeps it.

## How to run

`/condom` runs everything. The user can narrow it: **security**, **legal**, **quick** (the ten below only), or **fix** (work
through an existing report). When unsure which they want, run everything.

### 1. Profile the app

What you check depends on what the app is. Read `references/profile-signals.md` and build the profile from the code first: the
stack, where data lives, how people log in, what personal data is stored, whether money moves, which third-party scripts and SDKs
load, whether there is AI, uploads, user content, email or SMS, a mobile build. Record where each fact came from.

Then ask the user only what the code can't tell you, in one message, each with the assumption you'll make if they don't answer:

1. Where are your users, or where will you market? (US only / EU or UK too / anywhere)
2. Could anyone under 13 use it? Under 18?
3. Roughly how many users, and is it making money yet? (thresholds turn on these)
4. Who is behind it: you personally, or a company?
5. Anything sensitive: health, money, location, faces or voices, kids' data?
6. Is it live, and may I run harmless checks against the live site?

If nobody is there to answer (a scheduled or headless run), take the cautious assumption for each, and list the assumptions at the
top of the report.

### 2. Always run the ten

These ten account for most of what goes wrong in AI-built apps, so check them on every run, before anything else. Each has a full
entry in the reference files.

1. **A secret key the browser can see**: the database's service-role or admin key, a payment secret key, or an AI provider key in
   client code, a public env variable, or the built JavaScript. (SEC-SECRET-01, SEC-SECRET-02, SEC-ACCESS-03, SEC-AI-01)
2. **Database rules off or wide open**: tables without row-level security, policies that let the browser write prices, owners or
   status, open Firebase rules, public buckets holding private files. (SEC-ACCESS-01, -02, -10, -11)
3. **Price or total trusted from the browser**: the server charges or marks paid using a number the client sent, or the database
   lets a customer write their own order row. (SEC-PAY-01)
4. **Paid without proof**: orders or subscriptions granted on a redirect, or by a webhook whose signature is never verified.
   (SEC-PAY-02, SEC-PAY-03)
5. **Server routes that never ask who's calling**: API routes, server actions and admin pages protected only in the browser.
   (SEC-ACCESS-05, SEC-ACCESS-07)
6. **Someone else's record by changing an id**: lookups by id with no check that the row belongs to the caller. (SEC-ACCESS-04)
7. **No limit on anything that costs money or sends messages**: login, sign-up, password reset, email, SMS, and above all AI
   endpoints. (SEC-ABUSE-01 to -03, SEC-AI-02)
8. **Secrets in the repo or its history**: committed env files, keys in old commits, keys in logs. (SEC-SECRET-03, SEC-SECRET-04)
9. **Trackers and data collection with no privacy policy or consent**: analytics, ad pixels or session replay loading for
   everyone, and no page that says what is collected. (LAW-PRIV-01 to -03, LAW-TRACK-01 to -03)
10. **Charging people with no terms, no way to cancel online, or a silent renewal**. (LAW-TERMS-01, LAW-BILL-01, -02, -05)

One more that plain audits wave through: the redirect after login. A check like `startsWith("/")` looks safe and isn't
(SEC-AUTH-01). Read that entry before calling any redirect check fine.

### 3. Pick the rest from the profile

Read only the files the profile calls for. Loading everything wastes context and invites findings about features the app doesn't
have.

| Read | When the app has |
|---|---|
| `references/security/auth-access.md` | accounts, a database, any admin or per-user data |
| `references/security/secrets-payments.md` | any API key, any payment or credit system |
| `references/security/abuse-ai.md` | public endpoints, email or SMS sending, an AI feature |
| `references/security/input-files.md` | forms, search, rich text, uploads, URL fetching |
| `references/security/deploy-supply.md` | always (headers, config, dependencies) |
| `references/legal/privacy.md` | any personal data, including an email address |
| `references/legal/marketing-billing.md` | marketing email or SMS, subscriptions, trials, reviews or testimonials, payments |
| `references/legal/tracking-sensitive.md` | analytics, ad pixels, session replay, chat widgets, video, health, biometric or location data |
| `references/legal/kids-accessibility.md` | always for accessibility; the children's part when minors could use it |
| `references/legal/content-ai-platform.md` | user posts, AI features, third-party images, fonts or code, a mobile app, or no terms page |

If subagents are available, give each reference file to its own subagent with the profile, and have each return findings in the
format below. They run in parallel and keep the main context clean. Without subagents, go file by file.

### 4. Check, and prove

For each entry that applies, follow its **Find it** steps, then its **Prove it** step. Give every entry one status:

- **CONFIRMED**: proved, with evidence you can show (the request and response, the query result, the config value).
- **LIKELY**: the code shows it, but it wasn't or couldn't be proved live. Say what proof is missing.
- **CLEAR**: checked and fine. Record these; the list of what passed is how the user knows what was looked at.
- **NOT CHECKED**: say why (no access, needs the owner, out of scope).

For legal entries, decide **applies / doesn't apply yet / can't tell** from the thresholds before looking for the gap. A law that
doesn't apply goes in its own section with the trigger that would make it apply ("when you pass 100,000 California users or start
selling data").

Check the entry's **Status** and read date. Law moves: rules get vacated, delayed and amended. If an entry is marked proposed,
vacated or pending, or was read more than about six months ago and the finding matters, open its source link and confirm it before
you rely on it. Note in the report anything you re-checked and anything that had changed.

### 5. Try to break your own findings

Before anything goes in the report, go back through every CONFIRMED and LIKELY finding and try to disprove it. Is there a check
one layer up (middleware, a database policy, a gateway) that you missed? Is the "secret" a publishable key that is meant to be
public? Is the route unreachable? Does the law's exemption cover this user? Expect to drop or downgrade a few. A report with one
false alarm teaches the user to ignore the rest.

### 6. Report

Write `CONDOM-REPORT.md` at the project root using `assets/report-template.md`. Then give the user a short summary in chat: the
three things that would hurt first, the counts by severity, what doesn't apply to them, and what you need from them.

Severity, for security findings:
- **Critical**: anyone on the internet can take money, take over accounts, or read or destroy other users' data today.
- **High**: the same, but it needs an account, a guess, or a second weakness.
- **Medium**: a real weakness with limited reach, or one that makes another attack much easier.
- **Low**: hardening. Worth doing, not worth losing sleep.

For legal findings, rank by exposure and likelihood together: a law with per-user statutory damages and active plaintiffs' firms
(tracking pixels, text messages, biometrics, subscriptions, accessibility demand letters) outranks a larger theoretical fine that
regulators rarely pursue against small apps.

Write for someone who is not a security engineer or a lawyer: what could happen to them, in a sentence, before the term of art.

### 7. Fix

Only after the user says go. Work in this order: exposed keys (they rotate, you remove and re-wire), critical, high, then the rest.

- One finding at a time. Make the change, then run the same proof that confirmed it and show that it now fails. A fix without a
  re-test is a guess.
- Fix the cause in the right layer. An authorization hole is closed on the server or in the database rules, never by hiding a
  button.
- Don't change behaviour the user didn't ask about. If a fix needs a product decision (who should be allowed to do this?), ask.
- Commit each fix separately with a message that names the finding, so any one of them can be reverted.
- Legal fixes you can make: pages, banners, consent flows, footers, cancel paths, age gates, alt text, labels. Draft policies from
  the profile, so they describe what this app really collects and sends to whom, and mark them DRAFT for the owner's review.
  A policy copied from a template that doesn't match the code is itself a liability.
- Things only the owner can do go in a short checklist: rotate keys, sign data processing agreements, register a copyright agent,
  set spend caps, talk to a lawyer about the flagged items.

Finish by updating the report: what was fixed and re-tested, what is left, and what is waiting on the owner.

## What this skill won't do

- Attack, scan or probe anything the user doesn't own.
- Say an app is "secure" or "compliant". It reports what was checked, what was found and what wasn't looked at.
- Replace a lawyer where the report says one is needed, or a professional penetration test before handling data at scale.

## Finding format (for subagents and for your own notes)

```
ID · plain-word name
Status: CONFIRMED | LIKELY | CLEAR | NOT CHECKED     Severity or exposure:
Evidence: file:line, config value, or request → response (secrets masked)
What could happen: one sentence, in the user's terms
Fix: what to change, and who does it (Claude | owner | lawyer)
Source: the entry's source link
```
