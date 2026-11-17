<p align="center"><img src="assets/banner.png" alt="condom: wrap it before you ship. A black and gold foil wrapper, the left half rendered, the right half written in code." width="100%"></p>

# Condom

**Wrap it before you ship.** A Claude skill that checks your app for the ways it gets hacked and the ways it gets sued, proves what
it finds, tells you which laws don't apply to you, and fixes what it can.

Built for apps made mostly with AI: Next.js, Supabase or Firebase, Stripe, Vercel, an AI API. It works on any web or mobile app.

By [@murphmaxxing](https://www.instagram.com/murphmaxxing/).

## What it checks

**Hacked (106 checks)**
- Who can log in and who can reach what: open database rules, admin checks done in the browser, someone else's record by changing an id
- Keys and money: secret keys the browser can see, prices trusted from the client, orders marked paid without proof, unsigned webhooks
- Abuse and AI features: no rate limits, endpoints anyone can run up a bill on, prompt injection, a model with more power than its user
- What users send in: injection, cross-site scripting, unsafe uploads, fetching URLs a user supplies
- How it's deployed: missing headers, exposed `.git` and `.env`, source maps, old Next.js and React with known holes, risky dependencies

**Sued (115 checks)**
- Privacy: whether you need a policy and what it must say, US state laws, GDPR and UK rules, cookies and consent
- Marketing and billing: email and text rules, subscriptions and cancelling, free trials, fake reviews, claims you can't back up
- Tracking and sensitive data: ad pixels and session replay, video, health, face and voice, location
- Children and accessibility: under-13 rules, state laws on minors, ADA and WCAG, the EU's accessibility law
- Content, AI and stores: licences, user posts and takedowns, AI disclosure, your own terms, App Store and Google Play rules

Every check says how to find the problem in your code, how to prove it safely on your own app, how to fix it, and where the rule
comes from: a link to the primary source, a quote, and the date it was read.

## How it works

1. **Profiles your app from the code.** Stack, data, payments, third-party scripts, AI, uploads. Then it asks you the few things code
   can't tell it: where your users are, how many, whether kids could use it.
2. **Runs the ten checks that end most AI-built apps**, every time.
3. **Loads only the checks your app needs.** No findings about features you don't have.
4. **Proves each finding** with a file and line, a setting, or a harmless request to your own app. No proof, no finding.
5. **Tries to break its own findings** before you see them.
6. **Tells you which laws don't reach you yet**, with the threshold and what would change that.
7. **Writes `CONDOM-REPORT.md`**, worst first, in plain words.
8. **Fixes on your go**, one finding at a time, re-testing each.

## Install

Claude Code, for every project on your machine:

```bash
git clone https://github.com/murphyaidanbusiness-ux/condom ~/.claude/skills/condom
```

For one project, clone it into `.claude/skills/condom` inside that project instead.

## Use

Ask Claude to check your app before launch, or type `/condom`. Narrow it with `security`, `legal`, `quick` (the ten only) or `fix`.

It only works on your own app. It reads first and changes nothing until you say fix.

## What it is not

- **Not legal advice.** It is a careful first pass by a tool. The report marks what needs a lawyer.
- **Not a penetration test.** It won't attack anything, and it won't say your app is "secure" or "compliant". It says what it
  checked, what it found and what it didn't look at.
- **Not permanent.** Laws change. The legal checks were read on 2026-11-16 and each carries its status. The skill re-opens the
  source when a rule is old or marked pending.

## How it was checked

This is a first release. Read [VERIFICATION.md](VERIFICATION.md) for the detail.

- **Sources.** Every quote the skill cites was looked for on the page it cites, by script (`tools/check_quotes.py`) or by hand.
  Five quotes could not be confirmed and 26 entries are marked `UNVERIFIED` where the primary source couldn't be opened; each
  says what was tried.
- **First test.** Two AI-built sites with 12 known holes from a manual red-team audit. One run each, code only: with the skill,
  12 of 12 found; without it, 8 of 12. Both plain runs called a login redirect safe that wasn't. One run per case is a first
  result, not a benchmark. The legal checks have not been tested this way yet.

Found something wrong or out of date? Open an issue with the entry's ID and the source.

## Licence

[MIT](LICENSE)
