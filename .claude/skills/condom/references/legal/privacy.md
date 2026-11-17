# Privacy law (area PRIV)

Scope: the privacy rules that reach a small app collecting accounts, emails, payments and analytics. US federal (FTC Act section 5, FTC rules), California (CalOPPA, CCPA as amended by the CPRA, CIPA), the other state comprehensive laws as a group, state breach laws, the EU GDPR and ePrivacy cookie rule, the UK GDPR, PECR and the Data (Use and Access) Act 2025, and a short note each on Canada, Brazil and Australia. Most small apps are below the CCPA and most state-law thresholds; every entry says so where true. What reaches almost everyone: a truthful privacy policy (FTC Act, CalOPPA), consent before non-essential trackers for EU and UK visitors, breach notice, and reasonable security. Not legal advice; anything marked "lawyer" needs one. All sources read 2026-11-16.

Quick shared checks used by many entries (run once, reuse the output):
- **Data map:** list every table and column that holds a person: `supabase/migrations/*.sql`, `prisma/schema.prisma`, `drizzle/*`, Firestore collections in code (`collection(`), plus auth providers (Supabase Auth, Clerk, Firebase Auth).
- **Third parties:** `package.json` dependencies (`@vercel/analytics`, `posthog-js`, `mixpanel`, `@segment`, `@sentry`, `stripe`, `openai`, `@anthropic-ai/sdk`, `resend`, `@sendgrid`, `react-ga4`, `@next/third-parties`), and script tags: `rg -n "googletagmanager|gtag\(|fbq\(|connect\.facebook\.net|tiktok|clarity\.ms|hotjar|posthog|mixpanel|segment\.com|linkedin.*insight|snap\.licdn|reddit.*pixel" --glob "!node_modules"`.
- **Live check:** open the site in a private window with DevTools Network tab, before clicking anything on the banner. Every third-party domain that loads is a recipient. Cookies under Application > Cookies.
- **Policy:** find the privacy page (`rg -il "privacy" app pages src public`), fetch the live URL, and diff its list of data and recipients against the data map and third-party list.

## Contents
| ID | Plain name |
|---|---|
| LAW-PRIV-01 | Privacy policy says less than the code does (FTC Act s5 deception) |
| LAW-PRIV-02 | No privacy policy, or one missing CalOPPA items (Cal. Bus. & Prof. Code 22575) |
| LAW-PRIV-03 | Trackers load before EU or UK visitors agree (ePrivacy Art. 5(3), PECR reg. 6) |
| LAW-PRIV-04 | Pixels and session replay as "wiretapping" in California (CIPA, Penal Code 631, 637.2) |
| LAW-PRIV-05 | A deletion or privacy promise the code doesn't keep (FTC Act s5) |
| LAW-PRIV-06 | No security worth the name (FTC reasonable security; Safeguards Rule scope) |
| LAW-PRIV-07 | Breach with no plan to tell people (state breach laws, Cal. Civ. Code 1798.82) |
| LAW-PRIV-08 | California breach lawsuits per user (CCPA 1798.150) |
| LAW-PRIV-09 | Does the GDPR reach this app at all (GDPR Art. 3(2), Recital 23) |
| LAW-PRIV-10 | No reason on record for each use of data, no GDPR notice (GDPR Arts. 6, 13) |
| LAW-PRIV-11 | No way to delete, export or see your data, or slow answers (GDPR Art. 12(3), 15-22) |
| LAW-PRIV-12 | Vendors with no data processing agreement (GDPR Art. 28) |
| LAW-PRIV-13 | Sending EU data to US vendors (GDPR Ch. V, EU-US Data Privacy Framework, SCCs) |
| LAW-PRIV-14 | Breach not reported to the regulator in 72 hours (GDPR Arts. 33, 34) |
| LAW-PRIV-15 | No EU representative (GDPR Art. 27) |
| LAW-PRIV-16 | No record of processing (GDPR Art. 30) |
| LAW-PRIV-17 | GDPR fines and how exposed a small app really is (GDPR Art. 83) |
| LAW-PRIV-18 | UK differences: complaints process, analytics cookie exemption (UK GDPR, DUAA 2025) |
| LAW-PRIV-19 | Is the app a CCPA "business" (Cal. Civ. Code 1798.140(d)) |
| LAW-PRIV-20 | No "Do Not Sell or Share" link, Global Privacy Control ignored (CCPA regs 7025, 7026) |
| LAW-PRIV-21 | No notice at collection, slow rights requests (CCPA regs 7012, 7021) |
| LAW-PRIV-22 | Risk assessments and automated decisions (CCPA regs 7150, 7200) |
| LAW-PRIV-23 | The other state privacy laws as a group (Va. 59.1-576, Conn. PA 25-113, Tex. 541, Neb.) |
| LAW-PRIV-24 | Health data sent to analytics (Wash. RCW 19.373; FTC Health Breach Notification Rule) |
| LAW-PRIV-25 | Face or voice data without written consent (Illinois BIPA, 740 ILCS 14) |
| LAW-PRIV-26 | Children under 13 (COPPA Rule, 16 CFR 312) |
| LAW-PRIV-27 | Canada (PIPEDA; Quebec Law 25) |
| LAW-PRIV-28 | Brazil (LGPD, Lei 13.709) |
| LAW-PRIV-29 | Australia (Privacy Act 1988 small business exemption) |

---

### LAW-PRIV-01 · Privacy policy says less than the code does (FTC Act section 5, deceptive practices)
- **Applies when:** any US-facing business that publishes a privacy policy or makes privacy claims in the UI. No size threshold. **Does not apply when:** the claims are true and complete. Non-profits are mostly outside FTC jurisdiction.
- **What it requires:** what the policy and the UI say about data must match what the code does: what is collected, who receives it (analytics, ad pixels, error tracking, email, payments, AI providers), and what it is used for. Every table with a person in it needs a sentence in the policy, and AI input sent to OpenAI or Anthropic must be named, with whether it is used for training.
- **Exposure:** no fine for a first section 5 violation; the FTC gets an order (often 20 years of reporting and audits) and money for refunds. Violating that order, or an FTC rule, costs up to $53,088 per violation (16 CFR 1.98). No private right of action under the FTC Act; states have their own copies (UDAP laws). Small-app precedent: Goldenshores, a one-developer free Android flashlight app (FTC, 2013). BetterHelp paid $7.8 million (2023) for sending health questionnaire data to Facebook, Snapchat, Criteo and Pinterest after promising privacy ([FTC](https://www.ftc.gov/news-events/news/press-releases/2023/07/ftc-gives-final-approval-order-banning-betterhelp-sharing-sensitive-health-data-advertising)).
- **Find it:** run the shared data map and third-party list. Gaps: a table with a person in it the policy doesn't mention; a recipient domain in the Network tab not named; an AI SDK (`openai`, `@anthropic-ai/sdk`, `ai`) in `package.json` with no AI line in the policy; "we never share your data" or "we don't track you" copy (`rg -in "never (share|sell)|don't track|do not track"`) next to a pixel.
- **Fix:** rewrite the policy from the data map, one row per category, purpose and recipient; name the AI provider, what is sent, and whether the provider may train on it (Anthropic's commercial terms: "Anthropic may not train models on Customer Content from Services"). Remove false copy. **Who:** Claude drafts; owner confirms facts; lawyer for anything health, kids or finance.
- **Status:** in force.
- **Source:** https://www.ftc.gov/news-events/news/press-releases/2013/12/android-flashlight-app-developer-settles-ftc-charges-it-deceived-consumers · "the company's privacy policy deceptively failed to disclose that the app transmitted users' precise location and unique device identifier to third parties, including advertising networks" · read 2026-11-16. Penalty: https://www.ecfr.gov/current/title-16/chapter-I/subchapter-A/part-1/subpart-L/section-1.98 · "Section 5(m)(1)(A) of the FTC Act, 15 U.S.C. 45(m)(1)(A)" sets "$53,088" · read 2026-11-16

### LAW-PRIV-02 · No privacy policy, or one missing CalOPPA items (Cal. Bus. & Prof. Code 22575)
- **Applies when:** a commercial site or app collects personally identifiable information from anyone living in California. No revenue or user threshold. **Does not apply when:** no personal information is collected (a static page with no forms, no accounts, no trackers). App stores require a policy URL anyway (see the app-store file).
- **What it requires:** a conspicuously posted policy that lists categories of personal information collected and categories of third parties it is shared with; the process to review or change data, if one exists; how users hear of changes; an effective date; how the site responds to "do not track" signals; and whether other parties collect cross-site activity on it.
- **Exposure:** violation only if the policy is not posted within 30 days of being notified. The section sets no fine itself (see Open questions). A common overstatement, "You're out of compliance before your first user signs up", ignores the statute's 30-day notice clause.
- **Find it:** no `/privacy` route or footer link; policy with no effective date; no do-not-track sentence; no line about third-party trackers while the Network tab shows them.
- **Fix:** add `/privacy`, link it in the footer and at every signup form, include all six items. **Who:** Claude.
- **Status:** in force (amended effective January 1, 2014).
- **Source:** https://law.justia.com/codes/california/code-bpc/division-8/chapter-22/section-22575/ (official leginfo page also opened) · "An operator shall be in violation of this subdivision only if the operator fails to post its policy within 30 days after being notified of noncompliance." · read 2026-11-16

### LAW-PRIV-03 · Trackers load before EU or UK visitors agree (ePrivacy Directive Art. 5(3); UK PECR reg. 6)
- **Applies when:** the site stores or reads anything on a visitor's device (cookies, localStorage, pixels, device fingerprinting) and has visitors in the EU or UK. Applies to non-EU sites in practice through national regulators such as France's CNIL. **Does not apply when:** storage is strictly necessary for a service the user asked for (login session, cart, the consent choice itself, load balancing, security). UK only: first-party analytics and preference cookies are exempt from consent since 5 February 2026 if users get clear information and a free, simple way to object (see LAW-PRIV-18). France: first-party audience measurement is exempt if users are told, the last IP byte is truncated and trackers live at most 13 months. Ad pixels (Meta, TikTok, Google Ads), cross-site analytics and session replay are never exempt.
- **What it requires:** prior consent for everything non-essential. Reject must be as easy as accept: CNIL fined Google EUR 150 million and Facebook EUR 60 million (decisions of 31 December 2021, announced January 2022) because refusing was harder than accepting. A compliant banner has Accept and Reject on the first layer with equal weight, no pre-ticked boxes, nothing non-essential firing before a choice, a way to change the choice later, and a list of what each category does.
- **Exposure:** set by each national law; GDPR-level fines where the cookie data is personal data (LAW-PRIV-17). UK PECR fines now follow UK GDPR maxima (LAW-PRIV-18).
- **Find it:** (1) private window, Network tab, load the home page, do nothing: any request to an ad or analytics domain is a finding. (2) Application > Cookies: any `_ga`, `_fbp`, `_gcl_au`, `ph_*`, `mp_*`, `_clck` before a click is a finding. (3) In code, tags in `app/layout.tsx`, `pages/_document.tsx`, `_app.tsx` or `index.html` loaded unconditionally (`<Script strategy="afterInteractive"`, `GoogleAnalytics` from `@next/third-parties`) are the usual cause. (4) Banner component with only "Accept", or "Manage" hidden in grey text.
- **Fix:** gate every non-essential script on stored consent (load the script inside a `consent === "granted"` branch, or use Google Consent Mode v2 defaults set to `denied` before the tag loads); add an equal Reject button; add a "Cookie settings" footer link. Or drop the trackers: Vercel Analytics or a cookieless first-party setup may fit the UK or CNIL exemptions (check the vendor's claim against the conditions above). **Who:** Claude.
- **Status:** in force.
- **Source:** https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219 · "is only allowed on condition that the subscriber or user concerned has given his or her consent" · read 2026-11-16. CNIL fine: https://www.cnil.fr/sites/cnil/files/atoms/files/lettre_information_cnil_janvier_2022.html · "ne permettent pas de refuser les cookies aussi simplement que de les accepter" · read 2026-11-16. CNIL analytics exemption: https://www.cnil.fr/fr/node/677 · "To limit the lifetime of the trackers to 13 months." · read 2026-11-16.

### LAW-PRIV-04 · Pixels and session replay as "wiretapping" in California (CIPA)
- **Moved.** The full entry is in `tracking-sensitive.md`, LAW-TRACK-01 to LAW-TRACK-04. Read it when any third-party script (ad pixel, analytics, session replay, chat widget) loads for California visitors before they agree. It holds the current state of the law: the 2026 change to pen-register suits (SB 690) and the 2025 appeals decisions. Do not rely on an older summary of it here.

### LAW-PRIV-05 · A deletion or privacy promise the code doesn't keep (FTC Act section 5)
- **Applies when:** the policy, onboarding or UI promises deletion ("we delete your ID after verification"), retention limits, encryption, or "private". **Does not apply when:** no such promise is made (but then LAW-PRIV-10/11/21 may still require deletion).
- **What it requires:** a job or code path that actually does what the promise says, and evidence it ran. Example: Tea kept selfies and IDs it said it deleted, found in an open bucket in July 2025; the broken promise is the core claim in the suits.
- **Exposure:** as LAW-PRIV-01; plus breach liability (LAW-PRIV-07, 08) if the kept data leaks.
- **Find it:** `rg -in "delete|retain|retention|30 days|after verification|encrypt" ` in the policy and UI copy; then look for the job: Supabase `pg_cron` schedules (`select * from cron.job;`), Vercel cron in `vercel.json`, storage lifecycle rules, Firebase scheduled functions. No job, or a job that skips storage buckets or backups, is a finding. Check a delete-account path exists and cascades (`on delete cascade` in migrations; storage objects removed too).
- **Fix:** write the deletion job, log each run, include storage buckets; or change the promise to what you do. **Who:** Claude writes it; owner confirms retention period.
- **Status:** in force.
- **Source:** https://www.ftc.gov/news-events/news/press-releases/2023/03/ftc-ban-betterhelp-revealing-consumers-data-including-sensitive-mental-health-information-facebook · "BetterHelp will be required to pay $7.8 million for deceiving consumers after promising to keep sensitive personal data private" · read 2026-11-16. Tea facts: no primary source opened (see Open questions).

### LAW-PRIV-06 · No security worth the name (FTC reasonable security; Safeguards Rule only for financial institutions)
- **Applies when:** any business holding personal data. The FTC treats unreasonable security as unfair or deceptive. The Safeguards Rule (16 CFR 314) applies only to "financial institutions" under FTC jurisdiction (lenders, brokers, tax preparers, payday, collection, wire transfer, non-SEC investment advisers). **Does not apply when (Safeguards):** an ordinary SaaS that takes card payments through Stripe is not a financial institution for that reason alone. Institutions with fewer than 5,000 consumers' records are exempt from some of its provisions.
- **What it requires:** reasonable steps proportionate to the data: access control (RLS, least-privilege keys), MFA on admin and vendor dashboards, encryption, patching, logging, deleting what you don't need.
- **Exposure:** FTC order as LAW-PRIV-01; state AG suits; and the reasonable-security duty is the hook for CCPA breach suits (LAW-PRIV-08).
- **Find it:** this file only checks the paperwork side; the technical checks live in the security files. Ask the owner: MFA on Supabase, Vercel, Stripe, GitHub, domain registrar? A written list of who has admin access?
- **Fix:** run the security files; record what was done and when. **Who:** both.
- **Status:** in force.
- **Source:** https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know · "The Safeguards Rule applies to financial institutions subject to the FTC's jurisdiction" · read 2026-11-16. Reasonable security: https://www.ftc.gov/business-guidance/resources/start-security-guide-business · "Take reasonable steps to keep it secure." · read 2026-11-16

### LAW-PRIV-07 · Breach with no plan to tell people (state breach laws; example Cal. Civ. Code 1798.82)
- **Applies when:** a business holds computerized "personal information" as each state defines it (usually name plus SSN, driver's licence, financial account number with access code, and in many states username or email plus password). All 50 states, DC, Guam, Puerto Rico and the US Virgin Islands have such a law; the residence of the affected user decides which apply. **Does not apply when:** the data was encrypted and the key was not taken, or the data is outside the state's definition (an email list alone is outside most definitions).
- **What it requires (California example):** notify affected residents in the most expedient time possible; since 2026 within 30 calendar days of discovery; send a sample notice to the Attorney General within 15 days of notifying consumers when more than 500 Californians are affected. Other states have their own deadlines and AG thresholds.
- **Exposure:** AG enforcement under each state; California adds private suits (LAW-PRIV-08). Health apps: also LAW-PRIV-24.
- **Find it:** ask the owner whether a written incident plan exists (who decides, who drafts the notice, where user emails are exported from). Check that logs exist to tell which rows were accessed (Supabase logs retention, Vercel log drains).
- **Fix:** one-page incident runbook in the repo (`docs/incident.md`): contacts, how to pull affected users, notice template, state and GDPR clocks (LAW-PRIV-14). **Who:** Claude drafts; lawyer at the time of a real breach.
- **Status:** in force.
- **Source:** https://california.public.law/codes/civil_code_section_1798.82 · "shall be made within 30 calendar days of discovery or notification of the data breach" · read 2026-11-16. All-states count: https://www.ncsl.org/technology-and-communication/security-breach-notification-laws · "All 50 states, the District of Columbia, Guam, Puerto Rico and the Virgin Islands have laws requiring private businesses" · read 2026-11-16

### LAW-PRIV-08 · California breach lawsuits per user (CCPA, Cal. Civ. Code 1798.150)
- **Applies when:** the app is a CCPA "business" (LAW-PRIV-19) and unencrypted, unredacted personal information of the narrow 1798.81.5 kind (name plus SSN, ID, account number with code, medical, biometric data), or an email plus password or security answer, is stolen because security was unreasonable. **Does not apply when:** the app is below every CCPA threshold, which is most small apps; or the leaked data is outside that narrow list (names and emails without passwords). Often misstated: the old $100 to $750 figure is quoted as applying to any California user's plain-text data; the current figure is $107 to $799 and it is limited to CCPA businesses and those data types.
- **What it requires:** reasonable security. Before suing for statutory damages a consumer must give 30 days' written notice; adding security after the breach is not a cure.
- **Exposure:** $107 to $799 per consumer per incident or actual damages, whichever is greater (2025 CPI adjustment), plus injunctions. Class actions follow large leaks.
- **Find it:** do the threshold test first. Then: are passwords stored by the auth provider (good) or in your own table (`rg -n "password" supabase/migrations prisma`)? Are ID images or health fields stored unencrypted in public buckets?
- **Fix:** see security files; never store passwords yourself; encrypt or drop sensitive columns. **Who:** both.
- **Status:** in force; amounts effective January 1, 2025, next adjusted January 2027.
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.150 · "The implementation and maintenance of reasonable security procedures and practices pursuant to Section 1798.81.5 following a breach does not constitute a cure with respect to that breach." · read 2026-11-16. Amounts: https://privacy.ca.gov/laws-and-regulations/monetary-thresholds-in-the-ccpa/ · "Not less than $107 and not greater than $799 per consumer per incident or actual damages, whichever is greater." · read 2026-11-16

### LAW-PRIV-09 · Does the GDPR reach this app at all (GDPR Art. 3(2), Recital 23)
- **Applies when:** a non-EU app offers goods or services to people in the EU (paid or free) or monitors their behaviour in the EU (tracking, profiling, analytics that build behavioural profiles). Signs of offering: an EU language or currency (euro pricing, a German locale), mentioning EU customers, EU shipping, ads aimed at EU countries. **Does not apply when:** the site is merely reachable from the EU, in English, priced in dollars, with no EU targeting and no behavioural tracking. An app with a company or staff in the EU is covered by Art. 3(1) regardless.
- **What it requires:** if in scope, everything in LAW-PRIV-10 to 17.
- **Exposure:** LAW-PRIV-17.
- **Find it:** `rg -n "EUR|€|i18n|locales|de-DE|fr-FR|es-ES|it-IT"`, Stripe prices in EUR (`currency: "eur"`), shipping country lists, ad campaigns targeting EU (ask owner), analytics showing EU users, and behavioural trackers (LAW-PRIV-03).
- **Fix:** decide with the owner: in scope (do 10-17) or out (no EU currency or language, no EU targeting; consider blocking EU signups). Record the decision. **Who:** owner; lawyer if borderline.
- **Status:** in force.
- **Source:** https://eur-lex.europa.eu/eli/reg/2016/679/oj (text read via https://gdpr-info.eu/art-3-gdpr/ and https://gdpr-info.eu/recitals/no-23/) · "the offering of goods or services, irrespective of whether a payment of the data subject is required, to such data subjects in the Union" · Recital 23: "the mere accessibility of the controller's, processor's or an intermediary's website in the Union" is "insufficient to ascertain such intention" · read 2026-11-16

### LAW-PRIV-10 · No reason on record for each use of data, no GDPR notice (GDPR Arts. 6, 13)
- **Applies when:** GDPR in scope (LAW-PRIV-09). **Does not apply when:** out of scope.
- **What it requires:** each use of personal data needs one lawful basis: usually contract (running the account, billing), legitimate interests (security, basic product analytics, with a balancing test), consent (marketing email, ad tracking), or legal obligation (tax records). At collection, tell people: who you are and how to contact you, purposes and basis, legitimate interests relied on, recipients, transfers outside the EU, retention periods, their rights including complaint to a regulator.
- **Exposure:** lower or upper tier fines (LAW-PRIV-17).
- **Find it:** policy with no lawful basis per purpose, no retention periods, no recipients list, no transfer section, no regulator-complaint line. Marketing emails sent to every signup with no opt-in checkbox (`rg -n "newsletter|marketing" ` in signup code).
- **Fix:** add a table to the policy: purpose, data, basis, retention, recipients. Unticked opt-in for marketing. **Who:** Claude drafts; owner confirms.
- **Status:** in force.
- **Source:** https://gdpr-info.eu/art-13-gdpr/ (EUR-Lex text) · "the period for which the personal data will be stored, or if that is not possible," · read 2026-11-16. https://gdpr-info.eu/art-6-gdpr/ · "Processing shall be lawful only if and to the extent that at least one of the following applies:" · read 2026-11-16

### LAW-PRIV-11 · No way to delete, export or see your data, or slow answers (GDPR Arts. 12(3), 15-22)
- **Applies when:** GDPR in scope. **Does not apply when:** out of scope; but CCPA (LAW-PRIV-21), other states (LAW-PRIV-23) and both app stores (delete-account rule, see the app-store file) ask for similar paths.
- **What it requires:** answer requests to access, correct, delete, export (portability), restrict and object within one month, extendable by two months for complex or numerous requests.
- **Exposure:** upper-tier fines (LAW-PRIV-17); complaints to regulators are the usual trigger.
- **Find it:** search for a delete-account route and an export route (`rg -in "delete.?account|deleteUser|auth.admin.deleteUser|export|download.?(my)?.?data"`). Check the delete path removes rows in every table and storage objects, and tells vendors (Stripe customer, email list, analytics person profile). A privacy contact email that nobody reads is a finding (ask owner).
- **Fix:** settings page with Delete account (server-side cascade, plus vendor deletes: Stripe `customers.del`, Resend or SendGrid contact delete, PostHog person delete) and Download my data (JSON of the user's rows). **Who:** Claude.
- **Status:** in force.
- **Source:** https://gdpr-info.eu/art-12-gdpr/ (EUR-Lex text) · "without undue delay and in any event within one month of receipt of the request." · read 2026-11-16

### LAW-PRIV-12 · Vendors with no data processing agreement (GDPR Art. 28)
- **Applies when:** GDPR in scope and a vendor handles personal data for you. **Does not apply when:** out of scope (US state laws have their own service-provider contract terms; most vendor DPAs cover them too).
- **What it requires:** use only processors with adequate guarantees, under a contract setting out the processing. How to tell processor from controller: a processor uses the data only on your instructions for your service (Supabase hosting your database, Vercel serving and logging, Resend sending your email, an AI API under business terms). A vendor that also uses the data for its own purposes is a controller for that part: Stripe acts as a processor for your payments but as an independent controller for its fraud detection and legal duties; Meta or Google ad pixels are controllers or joint controllers for their ad use.
- **Exposure:** lower-tier fines (LAW-PRIV-17).
- **Find it:** list vendors from the third-party scan; for each, check whether its DPA exists and how it is accepted. Checked today: Supabase (accepting the agreement equals signing the SCCs; EU SCC Modules 2 and 3, UK addendum), Vercel (binding on entering the agreement; SCCs and UK IDTA), Stripe (incorporated by reference), Anthropic (DPA incorporated into commercial terms). OpenAI: UNVERIFIED (policy page refused automated reads); a secondary source says API customers complete OpenAI's DPA form.
- **Fix:** keep a vendors table in the repo (`docs/vendors.md`: vendor, data, role, DPA link, transfer mechanism); owner executes any DPA that needs a form. List processors in the policy. **Who:** Claude lists; owner signs.
- **Status:** in force.
- **Source:** https://gdpr-info.eu/art-28-gdpr/ (EUR-Lex text) · "Processing by a processor shall be governed by a contract or other legal act under Union or Member State law," · read 2026-11-16. Vendors: https://supabase.com/legal/dpa · "The Parties agree that acceptance of the Agreement shall have the same effect as signing the SCCs." · https://vercel.com/legal/dpa · "This Addendum shall become legally binding upon Customer entering into the Agreement or upon execution of this Addendum." · https://stripe.com/legal/dpa · "When Stripe Processes Personal Data as a Data Processor, it is acting as a Data Processor on behalf of User" · https://www.anthropic.com/legal/commercial-terms · "Data submitted through the Services will be processed in accordance with the Anthropic Data Processing Addendum" · all read 2026-11-16

### LAW-PRIV-13 · Sending EU data to US vendors (GDPR Chapter V; EU-US Data Privacy Framework; SCCs)
- **Applies when:** GDPR in scope and data goes to a US vendor (nearly every stack). **Does not apply when:** out of scope, or all processing stays in the EU.
- **What it requires:** a transfer mechanism: the vendor is certified under the EU-US Data Privacy Framework (check its listing at dataprivacyframework.gov), or standard contractual clauses are in its DPA (Supabase and Vercel include them), and the policy says so. Status: the EU General Court upheld the Framework on 3 September 2025 (Latombe, T-553/23); an appeal (C-703/25 P, lodged 31 October 2025) is pending at the Court of Justice. A ruling against it would leave SCCs as the fallback, which is why SCCs in the DPA matter.
- **Exposure:** upper-tier fines (LAW-PRIV-17).
- **Find it:** vendors table from LAW-PRIV-12 with a transfer column; policy with no transfer section.
- **Fix:** fill the column (DPF or SCCs per vendor); add a transfers paragraph to the policy. **Who:** Claude; owner confirms.
- **Status:** DPF in force; appeal pending.
- **Source:** https://eur-lex.europa.eu/eli/C/2025/6610/oj/eng · "Appeal brought on 31 October 2025" against the "judgment of the General Court" "delivered on 3 September 2025" in "Case T-553/23" · read 2026-11-16

### LAW-PRIV-14 · Breach not reported to the regulator in 72 hours (GDPR Arts. 33, 34)
- **Applies when:** GDPR in scope and a personal data breach occurs. **Does not apply when:** the breach is unlikely to result in a risk to people (record it anyway).
- **What it requires:** notify the lead supervisory authority within 72 hours of becoming aware, or explain the delay; tell affected people without undue delay when the risk is high; record every breach. Processors must tell you without undue delay.
- **Exposure:** lower-tier fines (LAW-PRIV-17).
- **Find it:** incident runbook from LAW-PRIV-07 has no GDPR clock or regulator contact.
- **Fix:** add the 72-hour step and the regulator (for a non-EU company without an EU establishment: the authority in each affected country; your Art. 27 representative helps). **Who:** Claude drafts; owner files.
- **Status:** in force.
- **Source:** https://gdpr-info.eu/art-33-gdpr/ (EUR-Lex text) · "not later than 72 hours after having become aware of it, notify the personal data breach to the supervisory authority" · read 2026-11-16

### LAW-PRIV-15 · No EU representative (GDPR Art. 27)
- **Applies when:** GDPR reaches a company with no EU establishment through Art. 3(2). **Does not apply when:** processing is occasional, does not include large-scale special-category or criminal data, and is unlikely to be risky. An app with ongoing accounts of EU users is usually not "occasional", so most in-scope apps need one.
- **What it requires:** appoint in writing a representative in an EU country where your users are; name them in the policy. UK GDPR has the same rule for UK users (a UK representative).
- **Exposure:** lower-tier fines. Enforcement against small non-EU apps for this alone is rare (no case found).
- **Find it:** policy with no "EU representative" section while LAW-PRIV-09 says in scope.
- **Fix:** owner contracts a representative service (paid, annual) and Claude adds its address to the policy. **Who:** owner.
- **Status:** in force.
- **Source:** https://gdpr-info.eu/art-27-gdpr/ (EUR-Lex text) · "Where Article 3(2) applies, the controller or the processor shall designate in writing a representative in the Union." · read 2026-11-16

### LAW-PRIV-16 · No record of processing (GDPR Art. 30)
- **Applies when:** GDPR in scope. **Does not apply when:** fewer than 250 employees, unless the processing is risky, not occasional, or includes special categories. Ongoing account data is "not occasional", so in practice a small app should keep one.
- **What it requires:** a written record of purposes, categories of people and data, recipients, transfers, retention, security.
- **Exposure:** lower-tier fines; regulators ask for it first in any inquiry.
- **Find it:** no such document in the repo.
- **Fix:** generate it from the data map and vendors table (`docs/ropa.md`). **Who:** Claude.
- **Status:** in force. (An EU "Digital Omnibus" proposal to change these rules exists; not verified, see Open questions.)
- **Source:** https://gdpr-info.eu/art-30-gdpr/ (EUR-Lex text) · "to an enterprise or an organisation employing fewer than 250 persons" · read 2026-11-16

### LAW-PRIV-17 · GDPR fines and how exposed a small app really is (GDPR Art. 83)
- **Applies when:** GDPR in scope. **Does not apply when:** out of scope.
- **What it requires:** nothing on its own; it sets the ceilings.
- **Exposure:** lower tier (processors, records, breach notice, representative) up to EUR 10 million or 2% of worldwide turnover; upper tier (lawful basis, consent, rights, transfers) up to EUR 20 million or 4%, whichever is higher. These are ceilings; fines scale with size and harm. Realistic exposure for a small non-EU app: a user complaint to a regulator, an order to fix, and difficulty enforcing abroad; cookie banners and ignored deletion requests are what complaints are about. People can also claim compensation (Art. 82, not opened today).
- **Find it:** n/a.
- **Fix:** prioritise LAW-PRIV-03, 11, 10, 12 in that order. **Who:** n/a.
- **Status:** in force.
- **Source:** https://gdpr-info.eu/art-83-gdpr/ (EUR-Lex text) · "up to 20 000 000 EUR, or in the case of an undertaking, up to 4 % of the total worldwide annual turnover" · read 2026-11-16

### LAW-PRIV-18 · UK differences: complaints process, analytics cookie exemption (UK GDPR; Data (Use and Access) Act 2025)
- **Applies when:** the app offers services to or monitors people in the UK (UK GDPR mirrors Art. 3(2)). **Does not apply when:** no UK targeting or monitoring.
- **What it requires (where it differs from the EU):** (1) since 19 June 2026, every organisation must give people a clear way to raise a data protection complaint, acknowledge it within 30 days, investigate and report the outcome; (2) since 5 February 2026, PECR lets first-party statistics cookies and appearance or functionality cookies run without consent if users get clear information and a simple, free way to object; advertising and cross-site tracking still need consent; (3) PECR fines are raised to UK GDPR levels (reported as GBP 17.5 million or 4%; not verified in the Act today).
- **Exposure:** ICO enforcement; UK GDPR ceilings (not re-verified today).
- **Find it:** no complaints route or form for UK users; analytics claimed as "exempt" that is third-party or cross-site.
- **Fix:** a "Privacy complaint" form or email with a 30-day acknowledgement in the policy; an objection toggle for exempt analytics. **Who:** Claude.
- **Status:** in force (complaints from 19 June 2026; cookies from 5 February 2026). ICO's final storage-and-access guidance: status not confirmed.
- **Source:** https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/06/new-data-protection-complaints-law-now-in-force/ · "acknowledge it within 30 days, investigate appropriately and communicate the outcome." · read 2026-11-16. https://www.legislation.gov.uk/ukpga/2025/18/schedule/12 · "to collect information for statistical purposes about how the service is used" · commencement: https://www.legislation.gov.uk/ukpga/2025/18/section/112 · "S. 112 in force at 5.2.2026" · read 2026-11-16

### LAW-PRIV-19 · Is the app a CCPA "business" (Cal. Civ. Code 1798.140(d))
- **Applies when:** a for-profit that does business in California and meets one threshold: annual gross revenue over $26,625,000 (2025 CPI-adjusted figure from $25 million); or buys, sells or shares personal information of 100,000 or more consumers or households a year; or makes 50% or more of revenue from selling or sharing personal information. **Does not apply when:** none of the three is met, which covers nearly every small app. Caution: "sharing" includes giving data to ad pixels for cross-context behavioural advertising, so a free app with heavy Meta or TikTok pixel traffic from 100,000 Californians can cross the second threshold without any revenue.
- **What it requires:** LAW-PRIV-20 to 22 and 08.
- **Exposure:** administrative fines up to $2,663 per violation, $7,988 intentional or involving known under-16s (2025 figures); CPPA and Attorney General enforce; private suits only for breaches (LAW-PRIV-08).
- **Find it:** ask owner for revenue; count California users or visitors in analytics; check whether ad pixels run.
- **Fix:** record the threshold decision in `docs/privacy-scope.md`. **Who:** owner.
- **Status:** in force; thresholds adjusted every odd year (next January 2027).
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.140 · "Alone or in combination, annually buys, sells, or shares the personal information of 100,000 or more consumers or households." · read 2026-11-16. https://privacy.ca.gov/laws-and-regulations/monetary-thresholds-in-the-ccpa/ · "Annual gross revenue amount within the definition of 'business'" "$26,625,000" · read 2026-11-16

### LAW-PRIV-20 · No "Do Not Sell or Share" link, Global Privacy Control ignored (CCPA regs 7025, 7026)
- **Applies when:** a CCPA business (LAW-PRIV-19) that sells or shares personal information (ad pixels count as sharing). **Does not apply when:** not a CCPA business, or no selling or sharing (no ad pixels, no data sales). Several other states also require honouring opt-out signals; not verified one by one here.
- **What it requires:** a "Do Not Sell or Share My Personal Information" link; treat a Global Privacy Control signal (HTTP header `Sec-GPC: 1` or `navigator.globalPrivacyControl === true`) as a valid opt-out for that browser and any linked profile; show that it was honoured (for example "Opt-Out Request Honored"); stop within 15 business days.
- **Exposure:** LAW-PRIV-19 fines.
- **Find it:** `rg -n "globalPrivacyControl|Sec-GPC|sec-gpc"`: no hits while pixels run is a finding. No footer opt-out link.
- **Fix:** middleware or client check that, when GPC is on, never loads ad pixels and marks the account opted out; footer link to an opt-out page; status message. **Who:** Claude.
- **Status:** in force (regulations effective January 1, 2026 version).
- **Source:** https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf · "A business that sells or shares personal information shall process any opt-out preference signal that meets the following requirements as a valid request to opt-out of sale/sharing" · read 2026-11-16

### LAW-PRIV-21 · No notice at collection, slow rights requests (CCPA regs 7012, 7021)
- **Applies when:** a CCPA business. **Does not apply when:** not one.
- **What it requires:** a notice at or before the point of collection (link at each form); rights to know, delete, correct, opt out and limit sensitive data; respond within 45 calendar days (one 45-day extension with notice).
- **Exposure:** LAW-PRIV-19 fines.
- **Find it:** signup and checkout forms with no privacy link next to the submit button; no request method (form or email).
- **Fix:** link under each form; a request form feeding the delete and export paths from LAW-PRIV-11. **Who:** Claude.
- **Status:** in force.
- **Source:** https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf · "at or before the point of collection of any personal information" · "no later than 45 calendar days after receipt of the request" · read 2026-11-16

### LAW-PRIV-22 · Risk assessments and automated decisions (CCPA regs 7150, 7200)
- **Applies when:** a CCPA business that sells or shares data, processes sensitive personal information, or uses automated decisionmaking technology (ADMT) for a "significant decision" (such as lending, housing, jobs, education, healthcare). **Does not apply when:** not a CCPA business; ordinary product features and an AI chatbot that decides nothing significant are not ADMT for a significant decision.
- **What it requires:** a risk assessment before starting the risky processing (from 1 January 2026), attestation and summary submitted to the CPPA by 1 April 2028; pre-use notice, opt-out and access rights for ADMT by 1 January 2027; cybersecurity audit certifications from 2028 to 2030 by revenue band (only for businesses meeting the audit criteria; not checked here).
- **Exposure:** LAW-PRIV-19 fines.
- **Find it:** ask: does the app use AI or scoring to approve, deny or price anything significant? Sell or share data?
- **Fix:** written risk assessment in `docs/`; ADMT notice and opt-out if applicable. **Who:** Claude drafts; lawyer reviews.
- **Status:** regulations in force January 1, 2026; ADMT compliance from January 1, 2027.
- **Source:** https://cppa.ca.gov/announcements/2025/20250923.html · "Businesses that use ADMT to make significant decisions must comply with the ADMT requirements beginning January 1, 2027." · read 2026-11-16

### LAW-PRIV-23 · The other state privacy laws as a group (examples: Va. Code 59.1-576, Conn. PA 25-113, Tex. Bus. & Com. Code 541, Nebraska)
- **Applies when:** the common pattern (Virginia model): the business controls or processes personal data of at least 100,000 state residents a year, or at least 25,000 and gets a large share of revenue from selling data. Outliers: Connecticut from 1 July 2026 covers anyone processing data of at least 35,000 consumers, or any sensitive data, or offering data for sale (payment data alone excluded). Texas and Nebraska have no user count: they cover any business that is not a "small business" under the US SBA definition, and small businesses there still may not sell sensitive data without prior consent. **Does not apply when:** under the state's threshold (most small apps in most states); Texas and Nebraska: an SBA small business that does not sell sensitive data. Which other states lowered thresholds (reports name Montana, Rhode Island and others) was not verified today.
- **What it requires:** a privacy notice, rights to access, correct, delete, port and opt out of targeted ads, sale and profiling; consent for sensitive data; data protection assessments for targeted ads; processor contracts.
- **Exposure:** Attorney General only in these examples; Texas up to $7,500 per violation after a 30-day cure notice.
- **Find it:** owner's user counts by state from analytics; whether any sensitive data (health, precise location, biometrics, kids) is processed (Connecticut trigger).
- **Fix:** if in scope, the CCPA work (LAW-PRIV-20, 21) plus a sensitive-data consent screen covers most of it. **Who:** owner decides; Claude builds.
- **Status:** in force (Connecticut amendments from July 1, 2026).
- **Source:** https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-576/ · "control or process personal data of at least 25,000 consumers" "and derive over 50 percent of gross revenue from the sale of personal data." · https://www.cga.ct.gov/2025/ACT/PA/PDF/2025PA-00113-R00SB-01295-PA.PDF · "(2) control or process consumers' sensitive data, excluding personal data controlled or processed solely for the purposes of completing a payment transaction; or (3) offer consumers' personal data for sale" · https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm · "is not a small business as defined by the United States Small Business Administration" · https://protectthegoodlife.nebraska.gov/node/501 · "A small business may still be liable for penalties if it sells sensitive data without receiving consent from the consumer." · all read 2026-11-16

### LAW-PRIV-24 · Health data sent to analytics (Washington My Health My Data Act; FTC Health Breach Notification Rule)
- **Moved.** The full entry is in `tracking-sensitive.md`, LAW-SENS-03 to LAW-SENS-05 and LAW-TRACK-06. Read it when the app handles anything about health, symptoms, medication, fitness or periods. It covers when HIPAA does and does not apply. Do not rely on an older summary of it here.

### LAW-PRIV-25 · Face or voice data without written consent (Illinois BIPA)
- **Moved.** The full entry is in `tracking-sensitive.md`, LAW-SENS-01 and LAW-SENS-02. Read it when the app captures or analyses faces, voices, fingerprints or selfies, including sending them to an AI API. It has the 2024 amendment (one violation per person, not per scan). Do not rely on an older summary of it here.

### LAW-PRIV-26 · Children under 13 (COPPA)
- **Moved.** The full entry is in `kids-accessibility.md`, LAW-KIDS-01 to LAW-KIDS-03. Read it when children could plausibly use the app, or it asks for an age or grade. It has the 2025 rule amendments and the state laws on minors. Do not rely on an older summary of it here.

### LAW-PRIV-27 · Canada (PIPEDA; Quebec Law 25)
- **Applies when:** collecting personal information in the course of commercial activity from people in Canada (federal PIPEDA); Quebec residents bring in Quebec's private-sector act as amended by Law 25. Alberta, BC and Quebec have their own laws deemed substantially similar. **Does not apply when:** no Canadian users or targeting (PIPEDA's reach over foreign sites turns on a "real and substantial connection"; not verified today).
- **What it requires (Quebec):** a person responsible for protecting personal information; a privacy impact assessment before sending data outside Quebec (most US vendors); tracking or profiling technologies off by default, turned on by the user.
- **Exposure:** Quebec administrative penalties up to CAD 10 million or 2% of worldwide turnover; penal proceedings also possible.
- **Find it:** Canadian users in analytics; trackers on by default for Quebec visitors.
- **Fix:** named privacy officer in the policy; transfer assessment note in `docs/`; consent gate covering Canada. **Who:** owner names officer; Claude drafts.
- **Status:** in force.
- **Source:** https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/ · "PIPEDA applies to private-sector organizations across Canada that collect, use, or disclose personal information" · read 2026-11-16. https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/principaux-changements-loi-25 · "ces technologies ne pourront être activées par défaut" · read 2026-11-16

### LAW-PRIV-28 · Brazil (LGPD, Lei 13.709/2018)
- **Applies when:** processing aims to offer goods or services to, or processes data of, individuals in Brazil (Art. 3; text not opened today). **Does not apply when:** no Brazilian users or targeting.
- **What it requires:** GDPR-like: legal basis, notice, rights, a named contact (encarregado; ANPD has relaxed rules for small agents, not verified today).
- **Exposure:** simple fine up to 2% of revenue in Brazil, capped at BRL 50 million per infraction.
- **Find it:** pt-BR locale, BRL prices, Brazilian users in analytics.
- **Fix:** the GDPR work covers most of it; add a Brazil contact line. **Who:** owner; lawyer if Brazil is a real market.
- **Status:** in force.
- **Source:** https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-republicacao-156213-pl.html · "multa simples, de até 2% (dois por cento) do faturamento da pessoa jurídica" · read 2026-11-16. Art. 3: UNVERIFIED (planalto.gov.br redirected; Câmara page showed only Art. 52).

### LAW-PRIV-29 · Australia (Privacy Act 1988, small business exemption, s 6D)
- **Applies when:** reported rule: businesses with annual turnover over AUD 3 million, plus some smaller ones (health services, traders in personal information). **Does not apply when:** a small business under that turnover that is not in an exception.
- **What it requires:** the Australian Privacy Principles.
- **Exposure:** not checked today.
- **Status:** exemption in force; secondary sources report the August 2026 exposure draft of the second reform tranche did not remove it, but disagree.
- **Find it / Fix:** ask owner for turnover and whether Australia is a market; if over the threshold, the GDPR work covers most of it. **Who:** owner.
- **Source:** UNVERIFIED. Tried oaic.gov.au (403), austlii.edu.au (403) and legislation.gov.au (section text not rendered; compilation C2026C00227, June 2026, exists).

## Not covered here
- App store privacy labels, privacy manifests and the in-app delete-account rule: app-store file. Noted in LAW-PRIV-11 because the delete path is shared.
- Marketing email (CAN-SPAM), SMS (TCPA), age verification laws (Texas App Store Accountability Act), AI disclosure (EU AI Act Art. 50), chatbot companion laws, DSA and Online Safety Act: other legal files.
- HIPAA (only for covered entities and their business associates), GLBA beyond the Safeguards Rule note, FERPA, sector laws.
- VPPA (video pages and pixels): named in LAW-PRIV-04, not researched.
- Technical security controls (RLS, buckets, keys): security files.

## Open questions
- CalOPPA penalty: 22575 sets none; the Attorney General is commonly said to enforce through the Unfair Competition Law. Not verified.
- SB 690 (CIPA): signing reported by a law-firm blog; the chaptered text on leginfo was not readable (403).
- BIPA damages and the 2024 single-violation amendment: unverified (ilga.gov certificate errors).
- OpenAI DPA: how API customers accept it (page refused automated reads).
- The EU "Digital Omnibus" proposals (reported November 2025) to change cookie rules and Art. 30: status not checked.
- Which state laws besides Connecticut lowered thresholds in 2025-2026, and which states require honouring GPC.
- UK PECR and UK GDPR fine figures after DUAA, and whether the ICO's final storage-and-access guidance is out.
- Tea (a deletion-promise example): no primary source opened for the July 2025 bucket exposure or the class actions.
- Firecrawl credits ran out mid-research; later checks used WebFetch, and some state sites (leginfo, ilga, OAIC) refused it.
