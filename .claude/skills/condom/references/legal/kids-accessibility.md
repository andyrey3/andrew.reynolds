# Legal: children and teens, accessibility (KIDS, A11Y)

Scope. Two areas where a small app gets letters without anyone noticing it first. Children: COPPA when the app is aimed
at under-13s or knows it has them, the 2025 amendments, the new state laws on teen accounts and app stores (each with its
court status, because several are enjoined or delayed), and the UK and EU rules in a line each. Accessibility: the ADA
website demand-letter business, California and New York, the government and federal-sales standards that reach vendors,
the European Accessibility Act, and why overlay widgets are not a defence. The practical standard everywhere is WCAG 2.1
or 2.2 Level AA. None of this is legal advice. Read on 2026-11-16 unless stated.

## Contents
- LAW-KIDS-01 · An app children obviously use, with no age question (COPPA: directed to children / actual knowledge)
- LAW-KIDS-02 · An age gate that tells kids the right answer (COPPA neutral age screen, mixed audience)
- LAW-KIDS-03 · Under-13 data going to ad or analytics SDKs (2025 COPPA amendments)
- LAW-KIDS-04 · Mobile apps in Texas: age categories from the app store (Texas SB 2420)
- LAW-KIDS-05 · Mobile apps in Utah (App Store Accountability Act)
- LAW-KIDS-06 · California's Age-Appropriate Design Code (AB 2273) and its injunction
- LAW-KIDS-07 · New York: SAFE for Kids Act and Child Data Protection Act
- LAW-KIDS-08 · UK Children's Code and Online Safety Act children's duties
- LAW-KIDS-09 · EU users under 16 (GDPR Article 8)
- LAW-A11Y-01 · Blind and keyboard users cannot use the site (ADA Title III demand letters)
- LAW-A11Y-02 · The practical standard and how to test it (WCAG 2.1 / 2.2 AA)
- LAW-A11Y-03 · An overlay widget instead of fixes (FTC v. accessiBe)
- LAW-A11Y-04 · California (Unruh Civil Rights Act)
- LAW-A11Y-05 · New York (state and city human rights laws)
- LAW-A11Y-06 · Selling to state or local government (DOJ Title II rule, 28 CFR 35 subpart H)
- LAW-A11Y-07 · Selling to federal agencies (Section 508)
- LAW-A11Y-08 · EU users (European Accessibility Act, Directive 2019/882)

---

### LAW-KIDS-01 · An app children obviously use, with no age question (COPPA, 15 U.S.C. 6501-6506; 16 CFR Part 312)
- **Applies when:** the site or app is directed to children under 13 (subject, cartoon characters, games, school content,
  child models, ads aimed at kids) in whole or part, or a general-audience operator has actual knowledge it collects
  personal information from a child under 13 (a user says their age, a parent emails). Any size, worldwide if it serves
  US children. **Does not apply when:** the service is not child-directed and the operator has no actual knowledge; a
  general audience app is not required to ask age, but if it asks and gets "11", it has knowledge.
- **What it requires:** notice to parents, verifiable parental consent before collecting personal information (which
  includes persistent identifiers used for ads, photos, voice, and now biometric identifiers), parental access and
  deletion, security, and retention limits.
- **Exposure:** FTC and state attorneys general; civil penalties up to $53,088 per violation (FTC FAQ, matching 16 CFR
  1.98 for penalties assessed after January 17, 2025). No private right of action under COPPA.
- **Find it:** read the landing page, app store category and marketing for child appeal; sign-up fields (`birth`, `dob`,
  `age`, `grade`, `school`); support inbox or database rows where users state an age; ad SDKs (`google-mobile-ads`,
  `react-native-google-mobile-ads`, Meta Audience Network) and pixels.
- **Fix:** if not child-directed: a neutral age question at sign-up (KIDS-02), block and delete under-13 sign-ups, a
  terms line that the service is for 13+. If child-directed: lawyer, full COPPA consent flow, no behavioural ads.
  **Who:** Claude (gate, deletion), lawyer (child-directed services).
- **Status:** in force; rule amended 2025 (KIDS-03).
- **Source:** https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions · "A court can hold
  operators who violate the Rule liable for civil penalties of up to $53,088 per violation." · read 2026-11-16

### LAW-KIDS-02 · An age gate that tells kids the right answer (COPPA neutral age screen; "mixed audience")
- **Applies when:** the app asks age at all, and especially a "mixed audience" service: child-directed in part but not
  primarily aimed at kids. **Does not apply when:** no age question and no child-directed content (KIDS-01 then decides).
- **What it requires:** a neutral screen: ask for date of birth or age open-ended, no default at 13 or older, no "You
  must be 13" text next to the field, no "I am over 12" checkbox. A mixed-audience service may age-screen and treat only
  visitors identified as under 13 as children, and must not collect personal information before it asks age.
- **Exposure:** as KIDS-01; a leading gate is evidence of knowledge.
- **Find it:** the sign-up component. Bad: a checkbox "I am 13 or older", a year dropdown starting at an adult year, a
  hint showing the minimum age, re-asking after a failed answer, analytics firing before the age step.
- **Fix:** an empty date-of-birth field with no hint; on under-13, end the flow, set a cookie or device flag so the child
  cannot just retry, and store nothing else; move any SDK init after the gate. **Who:** Claude.
- **Status:** in force.
- **Source:** https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions · "Avoid encouraging
  children to falsify age information" · read 2026-11-16. Mixed audience: https://www.law.cornell.edu/cfr/text/16/312.2 ·
  "shall not be deemed directed to children with regard to any visitor not identified as under 13" · read 2026-11-16

### LAW-KIDS-03 · Under-13 data going to ad or analytics SDKs (2025 COPPA Rule amendments)
- **Applies when:** a COPPA-covered service (KIDS-01) shares children's data with any third party. **Does not apply
  when:** the service is outside COPPA.
- **What changed:** published April 22, 2025; effective 60 days later (widely reported as June 23, 2025); full compliance
  365 days after publication, so April 22, 2026. Changes: a separate verifiable parental consent before disclosing a
  child's data to third parties (targeted ads), unless disclosure is essential to the service; a written information
  security program; a written data retention policy with deletion when no longer needed; "biometric identifier" added to
  personal information; a defined "mixed audience" category.
- **Exposure:** as KIDS-01.
- **Find it:** every SDK and pixel in a child-facing flow; whether the parental consent screen has a second, separate
  choice for sharing; whether a written security program and retention policy exist (ask the owner).
- **Fix:** turn off third-party ads and ad identifiers for child users; split the consent screen into collection and
  sharing; Claude drafts the retention policy and security program from the real stack for a lawyer to finish.
  **Who:** Claude (code, drafts), lawyer.
- **Status:** in force; compliance date April 22, 2026 has passed.
- **Source:** https://www.law.cornell.edu/cfr/text/16/312.5 · "An operator required to give the parent this option must
  obtain separate verifiable parental consent to such disclosure." · read 2026-11-16. Dates: Federal Register 2025-05904
  (https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule; the site
  blocked direct fetch, text read through a search index) · "the final Rule provides 365 days from the final Rule's
  publication date to come into full compliance" · read 2026-11-16

### LAW-KIDS-04 · Mobile apps in Texas: age categories from the app store (Texas SB 2420, Bus. & Com. Code ch. 121)
- **Applies when:** a developer distributes an app through an app store to users in Texas. **Does not apply when:** a
  web-only app with no app-store distribution.
- **What it requires (developer side):** assign an age rating to the app and to each in-app purchase; build a system that
  uses the age category and parental-consent signal the app store sends to verify the user's age category and, for
  minors, whether consent was obtained. The app store, not the developer, collects the consent.
- **Exposure:** a violation is a deceptive trade practice under the Texas DTPA. The figures "up to $10,000 per
  violation" and "lets parents sue you directly" are often quoted: the DTPA link is in the statute; the penalty figure and parents'
  standing were not verified today (Open questions).
- **Find it:** iOS Declared Age Range or Google Play age signals in the code (`DeclaredAgeRange`, `AgeRangeService`,
  Play Age Signals API); if absent in a Texas-distributed app, it is a gap.
- **Fix:** wire the platform age-range API, gate features or purchases by category, record the consent status the store
  returns. **Who:** Claude (code), owner (store settings), lawyer (scope).
- **Status:** effective January 1, 2026 but enjoined December 23, 2025 (CCIA v. Paxton, W.D. Tex.); the Fifth Circuit
  stayed the injunction June 4, 2026, and the Supreme Court denied an application to vacate the stay July 6, 2026. So it
  is enforceable now while the appeal continues. Saying it has been "in force since June 4, 2026" is right in effect.
- **Source:** https://capitol.texas.gov/tlodocs/89R/billtext/html/SB02420F.htm · "A violation of this chapter constitutes a
  deceptive trade practice" · read 2026-11-16. SCOTUS: https://www.supremecourt.gov/search.aspx?filename=/docket/docketfiles/html/public/25a1390.html
  · "Application (25A1390) to vacate stay ... is denied." · read 2026-11-16

### LAW-KIDS-05 · Mobile apps in Utah (App Store Accountability Act, Utah Code 13-75)
- **Applies when:** app-store distribution to Utah users. **Does not apply when:** web-only.
- **What it requires:** similar developer duties to Texas: use the store's age category and consent signal, and use age
  data only for the purposes the act allows.
- **Exposure:** private right of action (the 2026 amendment, HB 498, reportedly removed Attorney General enforcement).
- **Status:** UNVERIFIED. Law-firm summaries say HB 498 (2026) moved the main obligations from May 6, 2026 to May 6, 2027,
  and CCIA dismissed its challenge on April 21, 2026. I could not open the enacted text on le.utah.gov (the bill page
  showed no text). Treat as "not yet operative, check before advising".
- **Source:** https://le.utah.gov/~2026/bills/static/HB0498.html · UNVERIFIED: no quotable text loaded · tried 2026-11-16

### LAW-KIDS-06 · California's Age-Appropriate Design Code (AB 2273, Civ. Code 1798.99.28 et seq.)
- **Applies when:** a business that meets the CCPA thresholds offers an online service likely to be accessed by children
  under 18. **Does not apply when:** the business is under the CCPA thresholds (most small apps).
- **What it requires (in-force parts):** the coverage definition and the age-estimation requirement are no longer
  enjoined; some data-use limits, the dark-patterns limit and the impact-assessment duty remain enjoined.
- **Exposure:** Attorney General civil penalties.
- **Find it:** ask the owner about CCPA thresholds first; only then audit defaults for minors.
- **Fix:** if in scope, lawyer. **Who:** lawyer.
- **Status:** partly in force. Ninth Circuit ruling March 12, 2026, mandate April 3, 2026 (NetChoice v. Bonta).
- **Source:** UNVERIFIED primary. Read through law-firm summaries of the Ninth Circuit opinion (Cooley, March 30, 2026;
  Holland & Knight, March 19, 2026); the opinion itself was not opened. Open it on cdn.ca9.uscourts.gov before quoting.

### LAW-KIDS-07 · New York: SAFE for Kids Act and Child Data Protection Act
- **Applies when:** SAFE for Kids: an "addictive online platform" (user content, with at least 20 percent of time on an
  algorithmic feed) serving New York minors. Child Data Protection Act: an online service that collects personal data of
  New York users under 18. **Does not apply when:** SAFE: no algorithmic feed of user content. CDPA: no minors' data.
- **What it requires:** SAFE: age assurance and parental consent before an algorithmic feed or overnight notifications to
  minors. CDPA: no collecting, using, sharing or selling minors' data unless strictly necessary or with informed consent.
- **Exposure:** Attorney General; SAFE civil penalties up to $5,000 per violation (per the AG's release, as summarized).
- **Find it:** feed ranking code; notifications sent to minors at night; what data the app keeps on users who said they
  are under 18.
- **Fix:** chronological feed for unverified minors; no night notifications; minimise minors' data. **Who:** Claude, lawyer.
- **Status:** CDPA in force. SAFE final rules released July 28, 2026; act effective January 25, 2027.
- **Source:** https://ag.ny.gov/press-release/2026/attorney-general-james-and-governor-hochul-release-final-safe-kids-act-rules
  · "The SAFE for Kids Act goes into effect 180 days later, on January 25, 2027." · "The Child Data Protection Act is in
  effect." · read 2026-11-16

### LAW-KIDS-08 · UK Children's Code and Online Safety Act children's duties
- **Applies when:** UK users and the service is likely to be accessed by children. **Does not apply when:** no UK users.
- **What it requires:** Children's Code (ICO): 15 standards, high-privacy defaults, geolocation off, no nudge techniques,
  best interests of the child first. Online Safety Act: user-to-user and search services likely accessed by children had
  to complete a children's risk assessment by July 24, 2025; Protection of Children Codes in force July 25, 2025, with
  highly effective age assurance where harmful content is allowed.
- **Exposure:** ICO under UK GDPR; Ofcom under the OSA (fines up to the greater of £18 million or 10 percent of revenue,
  not re-verified).
- **Fix:** a written children's risk assessment kept with legal docs; privacy-high defaults for under-18s. **Who:** owner, lawyer.
- **Status:** in force.
- **Source:** https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/
  · "The code is a set of 15 flexible standards." · read 2026-11-16. Ofcom dates from a search of ofcom.org.uk (enforcement
  bulletin, important-dates page); not quoted from a page opened today.

### LAW-KIDS-09 · EU users under 16 (GDPR Article 8)
- **Applies when:** the app relies on consent to process data of EU children for an online service offered to them.
  **Does not apply when:** no EU users, or another lawful basis applies.
- **What it requires:** under 16 (member states may set 13 to 15), consent must come from the holder of parental
  responsibility, with reasonable efforts to verify it.
- **Exposure:** GDPR fines (Art. 83).
- **Fix:** set the gate age by country or use 16 for the EU. **Who:** Claude (gate), lawyer.
- **Status:** in force.
- **Source:** https://gdpr-info.eu/art-8-gdpr/ · "the processing of the personal data of a child shall be lawful where the
  child is at least 16 years old." · read 2026-11-16

---

### LAW-A11Y-01 · Blind and keyboard users cannot use the site (ADA Title III, 42 U.S.C. 12182)
- **Applies when:** a business open to the public offers goods or services on a website or app used in the US. Small
  businesses are sued, mostly by demand letter, because they settle. **Does not apply when:** unsettled for web-only
  businesses: the Ninth Circuit requires a nexus to a physical place (Robles v. Domino's, 913 F.3d 898, 2019), while
  courts in other circuits (notably New York federal courts) have let web-only claims proceed.
- **What it requires:** goods and services offered on the web must be accessible to people with disabilities. DOJ gives
  no single mandatory standard for businesses; it points to WCAG and Section 508 as helpful guidance.
- **Exposure:** private suits for injunctions and attorney's fees (no damages under Title III itself; damages come from
  state laws, A11Y-04 and 05); DOJ enforcement. A law-firm blog reports about $20,000 per typical settlement and 3,117 federal
  filings in 2025 (not re-verified today).
- **Find it:** A11Y-02 checks. **Fix:** A11Y-02 fixes and an accessibility statement page with a contact for problems.
  **Who:** Claude (fixes), owner (respond to any letter through a lawyer).
- **Status:** in force; DOJ's March 18, 2022 guidance.
- **Source:** https://www.ada.gov/resources/web-guidance/ · "the ADA's requirements apply to all the goods, services,
  privileges, or activities offered by public accommodations" · read 2026-11-16. Robles: UNVERIFIED primary (read through
  summaries; opinion not opened).

### LAW-A11Y-02 · The practical standard and how to test it (WCAG 2.1 / 2.2 Level AA)
- **Applies when:** every web or app UI. WCAG 2.1 AA is the standard in the DOJ Title II rule; WCAG 2.2 (W3C
  Recommendation, latest version dated December 12, 2024) adds Focus Not Obscured, Dragging Movements, Target Size
  (Minimum), Consistent Help, Redundant Entry and Accessible Authentication (Minimum).
- **Find it (code):**
  1. Images without alt: `<img(?![^>]*\balt=)`; decorative images should have `alt=""`; icon-only buttons need
     `aria-label`.
  2. Inputs without labels: `<input`, `<select`, `<textarea` with no `<label htmlFor>`, wrapping label or `aria-label`;
     placeholder is not a label.
  3. Clickable non-buttons: `onClick` on `div` or `span` with no `role`, `tabIndex={0}` and key handler; use `<button>`.
  4. Focus removed: `outline: none`, `outline-none`, `focus:outline-none` without a `focus-visible:` replacement.
  5. Keyboard traps: modals or menus without Escape to close and focus return; custom date pickers; carousels.
  6. Headings: one `h1`, no skipped levels; landmarks (`main`, `nav`); `lang` on `<html>`.
  7. Contrast: text at least 4.5:1, large text 3:1; check the design tokens (grey on grey is the usual failure).
  8. Auth: CAPTCHAs or puzzles without an alternative (2.2 Accessible Authentication).
- **Prove it (live, own site):** run `npx @axe-core/cli <url>` or Lighthouse (`npx lighthouse <url>
  --only-categories=accessibility`) on each key page; then tab through sign-up, checkout and settings with no mouse, and
  try one flow with the OS screen reader. Automated tools find about half the issues (axe says 57 percent on average);
  they cannot judge alt-text quality, reading order, focus order, or whether a flow is usable by keyboard.
- **Fix:** Claude fixes items 1 to 8 directly; add `@axe-core/playwright` or `jest-axe` to CI so regressions fail.
  **Who:** Claude.
- **Status:** W3C Recommendation.
- **Source:** https://www.w3.org/TR/WCAG22/ · "The visual presentation of text and images of text has a contrast ratio of
  at least 4.5:1" · read 2026-11-16. axe: https://github.com/dequelabs/axe-core · "With axe-core, you can find on average
  57% of WCAG issues automatically" · read 2026-11-16

### LAW-A11Y-03 · An overlay widget instead of fixes (FTC Act 5; FTC v. accessiBe)
- **Applies when:** the site relies on an accessibility overlay or toolbar script (accessiBe, UserWay, AudioEye and
  similar), or the app's own marketing claims "fully compliant". **Does not apply when:** no overlay and no claim.
- **What it requires:** an overlay is not a defence to an ADA claim; claiming it makes a site WCAG compliant is a
  deceptive claim the FTC has acted on.
- **Exposure:** accessiBe paid $1 million under an FTC order (April 22, 2025). For the site owner, the suit proceeds as if
  the overlay were not there.
- **Find it:** grep `acsbapp`, `accessibe`, `userway`, `audioeye`, `equalweb` in layouts; "ADA compliant" or "WCAG
  compliant" in copy.
- **Fix:** remove the overlay; fix the underlying issues (A11Y-02); replace compliance claims with an accessibility
  statement that names the standard targeted and a contact. **Who:** Claude.
- **Status:** order final.
- **Source:** https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-approves-final-order-requiring-accessibe-pay-1-million
  · "AccessiBe claimed the plug-in accessWidget can make any website compliant with Web Content Accessibility Guidelines
  (WCAG)." · read 2026-11-16

### LAW-A11Y-04 · California (Unruh Civil Rights Act, Civ. Code 51, 52)
- **Applies when:** California users and a business establishment. An ADA violation is also an Unruh violation.
  **Does not apply when:** a web-only business sued without proof of intentional discrimination: a California Court of
  Appeal held such claims fail (Martinez v. Cot'n Wash, 81 Cal.App.5th 1026, 2022). Federal courts in California still
  hear Unruh claims tied to ADA claims with a physical-place nexus.
- **Exposure:** statutory damages per offense plus fees. UNVERIFIED: Civ. Code 52(a)'s minimum ($4,000 per offense, per
  widely cited summaries; plaintiffs count each visit) could not be quoted because leginfo returned 403 to this fetch.
- **Find it / Fix:** A11Y-02. **Who:** Claude, lawyer (any letter).
- **Status:** in force.
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=52 · UNVERIFIED
  (403) · tried 2026-11-16

### LAW-A11Y-05 · New York (State Human Rights Law, Exec. Law 296; NYC Human Rights Law)
- **Applies when:** New York users. New York federal courts are the most common venue for website accessibility suits,
  and state and city laws add damages the ADA lacks. **Does not apply when:** unsettled for web-only businesses.
- **Exposure:** compensatory damages and fees under state and city law. UNVERIFIED: I did not open a primary source for
  New York today; treat this entry as a pointer for a lawyer, not a rule.
- **Find it / Fix:** A11Y-02. **Who:** Claude, lawyer.
- **Status:** in force.
- **Source:** UNVERIFIED (no primary source opened on 2026-11-16).

### LAW-A11Y-06 · Selling to state or local government (DOJ Title II rule, 28 CFR part 35, subpart H)
- **Applies when:** state and local governments (including public schools and universities) and the web content and apps
  they provide through vendors. If the owner sells to them, contracts will require WCAG 2.1 AA. **Does not apply when:**
  the app has no public-sector customers.
- **What it requires:** WCAG 2.1 Level AA for web content and mobile apps.
- **Exposure:** on the government; for vendors, lost contracts and indemnity clauses.
- **Find it:** ask the owner about public-sector customers; then A11Y-02 against 2.1 AA.
- **Fix:** A11Y-02, plus a conformance report (VPAT/ACR) the owner can attach to bids. **Who:** Claude (draft), owner.
- **Status:** in force, compliance dates extended by an interim final rule of April 20, 2026: April 26, 2027 for
  governments of 50,000 or more people, April 26, 2028 for smaller ones and special districts.
- **Source:** https://www.ada.gov/resources/2024-03-08-web-rule/ · "Version 2.1, Level AA is the technical standard for
  state and local governments' web content" · read 2026-11-16

### LAW-A11Y-07 · Selling to federal agencies (Section 508, 36 CFR part 1194)
- **Applies when:** a federal agency procures, develops, maintains or uses the product. **Does not apply when:** no
  federal customers.
- **What it requires:** WCAG 2.0 Level A and AA for electronic content (2.1 AA work satisfies it).
- **Fix:** A11Y-02 plus a VPAT. **Who:** Claude (draft), owner.
- **Status:** in force.
- **Source:** https://www.access-board.gov/ict/ · "ICT that is procured, developed, maintained, or used by agencies shall
  conform to the Revised 508 Standards." · read 2026-11-16

### LAW-A11Y-08 · EU users (European Accessibility Act, Directive (EU) 2019/882)
- **Applies when:** services provided to EU consumers after June 28, 2025 in the listed sectors: e-commerce services,
  consumer banking, e-books, electronic communications, access to audiovisual media, and websites and apps of passenger
  transport. A paid SaaS selling to consumers online is likely "e-commerce". **Does not apply when:** a microenterprise
  providing services (fewer than 10 people and annual turnover or balance sheet not over EUR 2 million); B2B-only
  services; services outside the list.
- **What it requires:** the Directive's accessibility requirements, applied through each member state's law; in practice
  EN 301 549, which tracks WCAG 2.1 AA.
- **Exposure:** set by each member state.
- **Find it:** ask headcount and turnover first; then A11Y-02.
- **Fix:** A11Y-02 and an accessibility statement. **Who:** Claude, owner.
- **Status:** applies from June 28, 2025.
- **Source:** https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32019L0882 · "Microenterprises providing
  services shall be exempt from complying with the accessibility requirements" · "an enterprise which employs fewer than 10
  persons and which has an annual turnover not exceeding EUR 2 million" · read 2026-11-16

---

## Not covered here
- Companion chatbots, self-harm protocols and break reminders for minors: the AI file.
- Apple and Google age-rating questionnaires and kids-category review rules: the app-store file.
- Louisiana's app-store law and California's Digital Age Assurance Act (AB 1043): not researched today.
- Accessibility of PDFs, video captions and audio description: touched only through WCAG.

## Open questions
- Texas SB 2420 penalty amount and whether parents can sue: the statute makes a violation a DTPA practice; the DTPA's
  penalty and consumer-suit terms were not opened (the Texas statutes site did not render).
- Utah HB 498 (2026): enacted dates and enforcement not confirmed from le.utah.gov.
- California AADC: quote the Ninth Circuit opinion (March 12, 2026) before relying on which parts are live.
- Unruh Act minimum damages and the New York entry: both need a primary source.
- Robles v. Domino's nexus language: quote the opinion.
- COPPA effective date: 60 days after April 22, 2025 falls on Saturday June 21; June 23, 2025 is the date most sources
  give. Compliance date April 22, 2026 is computed from the Federal Register's "365 days".
