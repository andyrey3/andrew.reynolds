# Legal: marketing, billing and payments (MKT, BILL)

Scope: how a small app sells, charges and contacts people. Subscriptions and cancellation, free trials, checkout disclosure,
EU consumer rights, app-store billing, card data and Stripe's own rules, tax and money transmission (BILL); marketing email
and SMS, reviews and testimonials, advertising claims, urgency tricks, giveaways (MKT). Privacy, cookies and pixels, children,
accessibility and AI disclosure live in other files. Every source below was opened on 2026-11-16 unless the Source line says
UNVERIFIED. US federal money figures come from the FTC's penalty table (16 CFR 1.98), currently $53,088 per violation for
penalties assessed after January 17, 2025. This is a checklist, not legal advice: where a fix says "lawyer", mean it.

## Contents
- LAW-BILL-01 · Cancelling is harder than signing up (ROSCA, 15 U.S.C. 8403(3))
- LAW-BILL-02 · Card taken before the recurring terms are shown and agreed (ROSCA, 8403(1)-(2))
- LAW-BILL-03 · "Click to cancel is dead, so anything goes" (FTC Negative Option Rule, 16 CFR 425)
- LAW-BILL-04 · California and other state auto-renewal laws (Cal. Bus. & Prof. Code 17600-17606)
- LAW-BILL-05 · Free trial converts with no reminder (Cal. BPC 17602(b), ROSCA)
- LAW-MKT-01 · Fake, AI-written or staff-written reviews and testimonials (16 CFR 465.2, 465.5)
- LAW-MKT-02 · Marketing texts without written consent (TCPA, 47 U.S.C. 227; 47 CFR 64.1200)
- LAW-MKT-03 · STOP replies ignored or slow (47 CFR 64.1200(a)(10))
- LAW-MKT-04 · Marketing email with no opt-out or address (CAN-SPAM, 15 U.S.C. 7701 et seq.)
- LAW-MKT-05 · Bulk mail without one-click unsubscribe (Gmail sender requirements)
- LAW-MKT-06 · "AI-powered" and results claims you cannot back up (FTC Act s.5)
- LAW-MKT-07 · Fake countdown timers, fake scarcity, dark patterns (FTC Act s.5; UK DMCC Act)
- LAW-MKT-08 · Security or compliance badges you have not earned ("HIPAA compliant", "bank-level security")
- LAW-MKT-09 · Paid, affiliate or free-product endorsements with no disclosure (16 CFR 255.5)
- LAW-MKT-10 · Paying for good reviews, hiding bad ones (16 CFR 465.4, 465.7)
- LAW-BILL-06 · Card numbers touching your own servers (PCI DSS, SAQ A)
- LAW-BILL-07 · Missing policy pages and a dispute spike (Stripe website checklist, card network rules)
- LAW-BILL-08 · Selling something Stripe does not allow (Stripe restricted businesses)
- LAW-BILL-09 · Price shown is not price charged; personalised prices (FTC Act s.5; 16 CFR 464; N.Y. GBL 349-a)
- LAW-BILL-10 · No refund policy, or a bot that invents one (Stripe checklist; ROSCA material terms)
- LAW-BILL-11 · Selling to EU consumers: 14 days to withdraw, order button, withdrawal button (Directive 2011/83/EU)
- LAW-MKT-11 · EU and UK marketing email without opt-in (ePrivacy Art. 13; PECR reg. 22)
- LAW-MKT-12 · Canadian recipients (CASL)
- LAW-MKT-13 · State texting laws (Florida 501.059 and other mini-TCPAs)
- LAW-MKT-14 · Unregistered SMS sender (carriers' A2P 10DLC)
- LAW-BILL-12 · Digital goods sold around the app store (Apple 3.1.1, Google Play Payments)
- LAW-MKT-15 · Naming competitors (FTC comparative advertising policy, 16 CFR 14.15)
- LAW-MKT-16 · Giveaways that require a purchase or skip registration (N.Y. GBL 369-e; Fla. Stat. 849.094)
- LAW-BILL-13 · Sales tax and VAT on digital goods (South Dakota v. Wayfair; EU VAT OSS)
- LAW-BILL-14 · Holding or moving users' money (money transmission, 31 CFR 1010.100(ff)(5))

---

### LAW-BILL-01 · Cancelling is harder than signing up (ROSCA, 15 U.S.C. 8403(3))
- **Applies when:** any US online sale with a negative option (subscription, auto-renewal, trial that converts). No revenue or size threshold. **Does not apply when:** one-time purchases with no recurring charge.
- **What it requires:** a simple way to stop recurring charges. FTC cases treat "simple" as: online signup means online cancel, no forced call or chat, no retention maze, charges stop when the user says stop.
- **Exposure:** ROSCA violations count as violations of an FTC rule (15 U.S.C. 8404), so civil penalties up to $53,088 each plus refunds; the statute names the FTC (8404) and state attorneys general (8405) as enforcers. Real cases: Shutterstock paid $35 million (May 13, 2026) for subscription and cancellation practices; Chegg paid $7.5 million (Sept 2025) for a lengthy cancellation flow.
- **Find it:** 1) Search for the cancel path: `grep -ri "cancel" app/ src/ components/` and the Stripe calls `subscriptions.cancel`, `subscriptions.update.*cancel_at_period_end`, `billingPortal.sessions.create`. 2) No cancel route, or cancel that only opens a mailto/support form, is a fail. 3) On the live site count clicks from logged-in home to "subscription cancelled" and compare with clicks from landing page to paid. 4) Look for retention screens that loop or lack a visible "cancel anyway" button.
- **Fix:** a Cancel button in account settings that calls Stripe (`cancel_at_period_end: true`) or opens the Stripe Customer Portal with cancellation enabled; one optional save offer with an equally visible "continue to cancel"; a confirmation email. **Who:** Claude (code), owner (enable cancellation in the Stripe portal settings).
- **Status:** in force.
- **Source:** https://www.law.cornell.edu/uscode/text/15/8403 · "provides simple mechanisms for a consumer to stop recurring charges from being placed on the consumer's credit card, debit card, bank account, or other financial account" · read 2026-11-16. Cases: https://www.ftc.gov/news-events/news/press-releases/2026/05/shutterstock-pay-35-million-settle-ftc-allegations-over-illegal-subscription-cancellation-practices and https://www.ftc.gov/news-events/news/press-releases/2025/09/ed-tech-provider-chegg-pay-75-million-settle-ftc-allegations-concerning-unlawful-cancellation · read 2026-11-16.

### LAW-BILL-02 · Card taken before the recurring terms are shown and agreed (ROSCA, 8403(1)-(2))
- **Applies when:** same as BILL-01. **Does not apply when:** no recurring charge.
- **What it requires:** before taking card details, show all material terms clearly (price, how often, when it renews, that it renews until cancelled, how to cancel); then get express informed consent to the charge. A terms checkbox that bundles everything is weak evidence of consent to the money part.
- **Exposure:** as BILL-01.
- **Find it:** 1) Open the pricing and checkout components (`grep -ri "checkout\|paywall\|pricing" --include=*.tsx`). 2) Bad: price shown without cadence ("$9" not "$9/month, renews monthly until you cancel"), renewal terms only in /terms, or consent shown after the card field. 3) Check `stripe.checkout.sessions.create` for `consent_collection` / `custom_text` and whether the app records consent (a table or column with user id, timestamp, terms version).
- **Fix:** on the same screen as the card field, a short block: price, period, renewal date, "renews until you cancel", link to cancel instructions; an unchecked box or explicit button text ("Start subscription, $9/month"); store user id, timestamp, IP and the text shown. **Who:** Claude.
- **Status:** in force.
- **Source:** https://www.law.cornell.edu/uscode/text/15/8403 · "clearly and conspicuously discloses all material terms of the transaction before obtaining the consumer's billing information" and "obtains a consumer's express informed consent before charging" · read 2026-11-16.

### LAW-BILL-03 · "Click to cancel is dead, so anything goes" (FTC Negative Option Rule, 16 CFR 425)
- **Applies when:** anyone relying on the 2024 "click to cancel" rule being gone. **Does not apply when:** n/a; this entry is about what is in force.
- **What it requires:** exactly this, as of 2026-11-16. The Eighth Circuit vacated the 2024 amended rule in July 2025 (Custom Communications v. FTC, 142 F.4th 1060). On February 12, 2026 the FTC re-published the old pre-2024 rule, which covers only prenotification plans (book-of-the-month style). On March 13, 2026 the FTC opened an advance notice of proposed rulemaking (comments closed April 13, 2026); no new rule has been adopted. ROSCA (BILL-01, BILL-02) and state laws (BILL-04) still apply in full, and the FTC keeps suing under them.
- **Exposure:** none from the vacated rule; full exposure under ROSCA and state law.
- **Find it:** the owner's answers ("we don't need easy cancel, the rule was struck down") or code comments saying the same.
- **Fix:** build to ROSCA plus California's law, which is the stricter floor. **Who:** Claude.
- **Status:** 2024 rule vacated July 2025; pre-2024 rule restored, effective February 12, 2026; new rulemaking at ANPRM stage since March 13, 2026.
- **Source:** https://www.federalregister.gov/documents/2026/02/12/2026-02866/revision-of-the-negative-option-rule-withdrawal-of-the-cars-rule-removal-of-the-non-compete-rule-to · "In light of the Eighth Circuit's vacatur, this final rule revises the Negative Option Rule to restore it in the form it existed before the 2024 Rule became effective." · read 2026-11-16. ANPRM: https://www.federalregister.gov/documents/2026/03/13/2026-04952/rule-concerning-the-use-of-prenotification-negative-option-plans · read 2026-11-16.

### LAW-BILL-04 · California and other state auto-renewal laws (Cal. Bus. & Prof. Code 17600-17606)
- **Applies when:** an auto-renewing offer to consumers in California (no size threshold); the 2024 amendments (AB 2863) apply to contracts entered, amended or extended on or after July 1, 2025. Many other states have their own auto-renewal laws, and New York City adopted a municipal rule in 2026. **Does not apply when:** business-to-business only, or no auto-renewal.
- **What it requires (California):** terms clear and conspicuous and in visual proximity to the consent request; express affirmative consent to the renewal terms; consent records kept at least three years or one year after termination, whichever is longer; cancellation in the same medium used to sign up (online signup, online cancel); at most a save offer shown next to a "click to cancel" button that works immediately; an annual reminder for annual plans; a notice before a trial or promo price ends (see BILL-05).
- **Exposure:** UNVERIFIED for the remedy sections (17603, 17604 returned 403 today). Treat as civil exposure to the state and private suits under California's consumer laws; ask a lawyer for numbers.
- **Find it:** 1) Is there a stored consent record per subscription (table, Stripe metadata) with the shown text? Missing is a fail. 2) Cancel flow per BILL-01, and any save-offer screen without a same-screen cancel button. 3) Annual plans: a scheduled job or Stripe setting that emails a reminder with product, amount, frequency and how to cancel.
- **Fix:** consent log retained 3+ years; one-screen save offer with "Click to cancel"; annual reminder email (Stripe "upcoming renewal" emails or a cron job). **Who:** Claude; owner turns on Stripe renewal reminders.
- **Status:** in force; amended section applies from July 1, 2025. NYC rule: reported in force October 1, 2026, primary text not readable today (see Open questions).
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=17602 · "Fail to maintain verification of the consumer's affirmative consent for at least three years, or one year after the contract is terminated, whichever period is longer." · read 2026-11-16.

### LAW-BILL-05 · Free trial converts with no reminder (Cal. BPC 17602(b), ROSCA)
- **Applies when:** a free trial or intro price that turns into a paid plan, with California consumers. **Does not apply when:** the trial ends without charging and asks for a card only when the user chooses to upgrade.
- **What it requires:** at signup, the price after the trial in plain view next to the consent; a notice 3 to 21 days before the trial or promo price ends; the same online cancel path.
- **Exposure:** as BILL-04, plus ROSCA (BILL-01).
- **Find it:** `trial_period_days`, `trial_end`, `trial_settings` in Stripe calls; then search for a reminder job (`grep -ri "trial_will_end\|trial.*remind"`). No handler for Stripe's `customer.subscription.trial_will_end` event (or another scheduled reminder) and no Stripe trial reminder email turned on is a fail; check the event's timing fits the 3-to-21-day window.
- **Fix:** handle `customer.subscription.trial_will_end` (or a cron) and email: trial end date, amount, cancel link. Show "Free for 7 days, then $X/month" beside the start button. **Who:** Claude; owner enables Stripe's trial reminder emails.
- **Status:** in force.
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=17602 · "The notice shall be provided at least 3 days before and at most 21 days before the expiration of the predetermined period of time for which the free gift or trial, or promotional or discounted price, applies." · read 2026-11-16.

### LAW-MKT-01 · Fake, AI-written or staff-written reviews and testimonials (16 CFR 465.2, 465.5)
- **Applies when:** any US business showing reviews or testimonials, including on its own landing page. **Does not apply when:** real reviews from real customers, shown as written, with staff connections labelled.
- **What it requires:** no reviews or testimonials from people who don't exist (AI-generated included) or who never used the product; reviews by officers, managers or staff must clearly disclose the connection. A business that puts testimonials on its own site is disseminating them, not merely hosting.
- **Exposure:** civil penalties for knowing violations, up to $53,088 per violation (each fake review can count); FTC enforces; no private right of action under the rule.
- **Find it:** 1) Landing copy: `grep -ri "testimonial\|review\|stars\|rating" app/ components/ content/` and read the names and quotes. Placeholder names ("Sarah K., Founder"), stock avatars, identical phrasing, or quotes in a hard-coded array are red flags. 2) Seed files: `grep -ri "review" supabase/seed.sql prisma/seed.* *.json`. 3) Reviews table: can a review exist without a linked user or order? Can a user set the display name freely? (In one audit of two AI-built restaurant sites, "fake reviews under any name" appeared on both.) 4) Ask the owner where each testimonial came from.
- **Fix:** delete any testimonial without a real, consenting source; label team quotes "from our team"; reviews only from verified purchasers, name taken from the profile, one per order. **Who:** Claude (code, labels), owner (confirm sources).
- **Status:** in force since October 21, 2024.
- **Source:** https://www.law.cornell.edu/cfr/text/16/465.2 · "It is an unfair or deceptive act or practice and a violation of this part for a business to write, create, or sell a consumer review, consumer testimonial, or celebrity testimonial that materially misrepresents" · read 2026-11-16. Effective date and own-site rule: https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers · "A business that puts testimonials on its own website is disseminating them and is not merely 'hosting' them." · read 2026-11-16.

### LAW-MKT-02 · Marketing texts without written consent (TCPA, 47 U.S.C. 227; 47 CFR 64.1200)
- **Applies when:** automated marketing texts or calls to US mobile numbers ("we miss you", "your cart is waiting", promos). **Does not apply when:** purely informational texts the user asked for (login codes, receipts, appointment reminders) with ordinary prior express consent.
- **What it requires:** prior express written consent for marketing: a signed agreement (an e-sign or checkbox counts) naming the seller and the number, saying it authorizes automated marketing messages, and saying consent is not a condition of purchase. Telephone solicitations only between 8 a.m. and 9 p.m. recipient local time. The FCC's 2023 "one-to-one consent" rule was vacated by the Eleventh Circuit on January 24, 2025.
- **Exposure:** private suits: actual loss or $500 per message, whichever is greater, up to three times that ($1,500) if willful or knowing. Per message, not per user. Class actions are common.
- **Find it:** 1) Find SMS senders: `grep -ri "twilio\|messages.create\|sns.publish\|vonage\|messagebird\|plivo\|telnyx"`. 2) For each, is it marketing or transactional? 3) Is there a consent record (`sms_consent`, `marketing_opt_in`, timestamp, IP, the shown text) checked before each marketing send? 4) Is the consent box pre-checked or bundled into terms? 5) Any send-time logic using recipient time zone?
- **Fix:** separate transactional and marketing SMS paths; an unchecked box with the required disclosure text; store user id, number, timestamp, IP, exact text; block marketing sends without a consent row; quiet hours by recipient time zone. **Who:** Claude; lawyer for the consent wording if SMS marketing is core to the business.
- **Status:** in force; one-to-one consent rule vacated January 24, 2025.
- **Source:** https://www.law.cornell.edu/uscode/text/47/227 · "an action to recover for actual monetary loss from such a violation, or to receive $500 in damages for each such violation, whichever is greater" · read 2026-11-16. Consent definition: https://www.ecfr.gov/current/title-47/part-64/section-64.1200 (paragraph (f)(9)) · read 2026-11-16. Vacatur: https://law.justia.com/cases/federal/appellate-courts/ca11/24-10277/24-10277-2025-01-24.html · "One-to-one consent is not required." · read 2026-11-16.

### LAW-MKT-03 · STOP replies ignored or slow (47 CFR 64.1200(a)(10))
- **Applies when:** any text program that needs consent (LAW-MKT-02). **Does not apply when:** no texting.
- **What it requires (current eCFR text):** honor a revocation made by any reasonable means within ten business days; reply words like stop, quit, end, revoke, opt out, cancel and unsubscribe count; a sender may not name an exclusive way to opt out; if the protocol cannot take replies, each text must say so and give another way to opt out; one confirmation text is allowed (presumed fine if sent within five minutes). The "one STOP covers all your unrelated informational texts" part is waived until January 31, 2027. On September 30, 2026 the FCC adopted an order letting senders designate exclusive opt-out methods and narrowing revoke-all; it takes effect 30 days after Federal Register publication, which had not happened as of the latest report found.
- **Exposure:** as LAW-MKT-02, per message sent after revocation.
- **Find it:** an inbound SMS webhook (`grep -ri "inbound\|incoming.*sms\|/api/sms"`) that matches those keywords and writes an opt-out; every send path checks it. If the provider handles opt-out keywords itself, confirm with the owner that its opt-out list is also checked by every other send path.
- **Fix:** inbound handler for the keywords and free text; opt-out table checked before every send; one confirmation text. **Who:** Claude; owner checks the provider's opt-out settings.
- **Status:** in force; revoke-all waived to January 31, 2027; September 30, 2026 order adopted, not yet effective.
- **Source:** https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200 · "All requests to revoke prior express consent or prior express written consent made in any reasonable manner must be honored within a reasonable time not to exceed ten business days from receipt of such request." · read 2026-11-16. Waiver: https://docs.fcc.gov/public/attachments/DA-26-12A1.pdf · "the effective date of section 64.1200(a)(10) is extended to January 31, 2027 to the extent discussed herein" · read 2026-11-16.

### LAW-MKT-04 · Marketing email with no opt-out or address (CAN-SPAM, 15 U.S.C. 7701 et seq.)
- **Applies when:** any commercial email (primary purpose is to advertise or promote), to anyone, with no size threshold; consent is not required in the US but opt-out is. **Does not apply when:** messages that are only transactional or relationship content (receipts, password resets, account notices); those must still have honest routing information.
- **What it requires:** honest From, Reply-To and routing; non-deceptive subject; identify it as an ad; a valid physical postal address; a clear way to opt out that works for at least 30 days after sending; honor opt-outs within 10 business days; never use a bought list in a way that hides consent.
- **Exposure:** up to $53,088 per email; FTC and state AGs enforce. You stay liable for mail an email vendor sends for you.
- **Find it:** 1) Find templates: `grep -ri "resend\|sendgrid\|postmark\|mailgun\|nodemailer\|ses" ` then open each template (`emails/`, `*.mjml`, React Email components). 2) Marketing templates missing an unsubscribe link or a postal address in the footer are a fail. 3) Unsubscribe link must hit a route that writes a suppression record, and every marketing send must check it. 4) Look for imported contact CSVs.
- **Fix:** shared footer component with address (a PO box or registered agent address works) and unsubscribe link; `/unsubscribe` route writing to a suppression list; sends filtered by it; transactional mail kept free of promos. **Who:** Claude; owner supplies the postal address.
- **Status:** in force.
- **Source:** https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business · "Each separate email in violation of the CAN-SPAM Act is subject to penalties of up to $53,088" and "You must honor a recipient's opt-out request within 10 business days." · read 2026-11-16.

### LAW-MKT-05 · Bulk mail without one-click unsubscribe (Gmail sender requirements)
- **Applies when:** a provider's rule, not a law: Gmail's bulk sender requirements (and Yahoo's). **Does not apply when:** low-volume transactional mail, which still needs SPF and DKIM.
- **What it requires:** SPF and DKIM for every sender; DMARC (policy can be `none`) for bulk senders; marketing mail supports one-click unsubscribe (the `List-Unsubscribe` and `List-Unsubscribe-Post` headers) plus a visible link in the body.
- **Exposure:** mail lands in spam or is rejected; no fine.
- **Find it:** check DNS for SPF, DKIM, DMARC records; check the send call for `List-Unsubscribe` headers (Resend, SendGrid and Postmark can add them).
- **Fix:** add the headers and a POST handler for one-click unsubscribe; add the DNS records. **Who:** Claude (code), owner (DNS).
- **Status:** in force at Google.
- **Source:** https://support.google.com/a/answer/81126 · "Marketing messages and subscribed messages must support one-click unsubscribe" · read 2026-11-16.

### LAW-MKT-06 · "AI-powered" and results claims you cannot back up (FTC Act s.5)
- **Applies when:** any US advertising claim, including landing pages, app-store text and ads. **Does not apply when:** claims you can prove with a test or record you hold, or plain opinion and puffery ("we love it").
- **What it requires:** claims about what the product does, how accurate it is, what users will earn or achieve, or that it replaces a professional need substantiation before you make them. "AI" is not an exemption.
- **Exposure:** FTC orders, refunds; civil penalties if a rule or prior order is broken. DoNotPay paid $193,000 ("robot lawyer"); accessiBe paid $1 million for claiming its AI widget makes any site WCAG compliant.
- **Find it:** read the landing page, pricing page, meta descriptions and store listing; `grep -riE "guarantee|100%|accura|detect|diagnos|replace (your|a) (lawyer|doctor|accountant)|earn \$|passive income|compliant" app/ content/ public/`. Each hit needs a test result or record behind it.
- **Fix:** rewrite unprovable claims ("helps you draft" not "replaces your lawyer"; drop accuracy figures without a reproducible test); keep a `claims.md` with the evidence per claim. **Who:** Claude drafts, owner approves.
- **Status:** in force.
- **Source:** https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes · "The FTC's enforcement actions make clear that there is no AI exemption from the laws on the books." · read 2026-11-16. accessiBe: https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-approves-final-order-requiring-accessibe-pay-1-million · read 2026-11-16.

### LAW-MKT-07 · Fake countdown timers, fake scarcity, dark patterns (FTC Act s.5; UK DMCC Act)
- **Applies when:** urgency or social-proof UI ("offer ends in 09:59", "3 spots left", "12 people viewing"), pre-checked add-ons, buried fees, confirm-shaming. **Does not apply when:** the number is real and read from real data with a real end time.
- **What it requires:** don't create false urgency or hide terms. The FTC's 2022 dark patterns report names countdown timers that suggest a limit that doesn't exist. In the UK the CMA enforces consumer law directly under the DMCC Act 2024 and says it is pursuing misleading time-limited offers and drip pricing.
- **Exposure:** US: FTC orders and refunds. UK: CMA-imposed fines (commonly quoted as up to 10% of global turnover; primary not opened today, see Open questions).
- **Find it:** `grep -riE "countdown|timer|setInterval|spots left|only [0-9]+ left|people (are )?viewing|Math.random" components/ app/`. A timer that restarts on refresh or a count that isn't read from the database is a fail. Pre-checked boxes: `defaultChecked`, `checked={true}` near add-ons or consents.
- **Fix:** delete fake urgency or wire it to real values (a real `ends_at`, real inventory); unchecked add-ons. **Who:** Claude.
- **Status:** in force.
- **Source:** https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers · "countdown timers designed to make consumers believe they only have a limited time to purchase a product or service" · read 2026-11-16. UK: https://competitionandmarkets.blog.gov.uk/2026/10/14/direct-consumer-enforcement-18-months-on/ · read 2026-11-16.

### LAW-MKT-08 · Security or compliance badges you have not earned ("HIPAA compliant", "bank-level security")
- **Applies when:** the site claims encryption, certifications or legal compliance (SOC 2, HIPAA, GDPR, PCI, "bank-level", "end-to-end encrypted"). **Does not apply when:** the claim is true and you can show the report, the setting or the signed agreement.
- **What it requires:** security claims are advertising claims and must be true. Zoom settled FTC charges for touting "end-to-end, 256-bit encryption" it did not provide. There is no government "HIPAA certified" stamp.
- **Exposure:** FTC order; for health apps, the claim itself can draw HHS or FTC attention.
- **Find it:** `grep -riE "hipaa|soc ?2|gdpr compliant|pci compliant|bank[- ]level|military[- ]grade|end-to-end|encrypted" app/ content/ public/ components/`. For each hit ask: is there a report, a BAA, a config that proves it? An app whose AI vendor gets user data with no BAA cannot say HIPAA compliant.
- **Fix:** delete or narrow to what is true ("data encrypted in transit with TLS; payments handled by Stripe"). **Who:** Claude drafts, owner confirms.
- **Status:** in force.
- **Source:** https://www.ftc.gov/news-events/news/press-releases/2020/11/ftc-requires-zoom-enhance-its-security-practices-part-settlement · "misled users by touting that it offered 'end-to-end, 256-bit encryption'" · read 2026-11-16. HHS on private "HIPAA certifications": UNVERIFIED (https://www.hhs.gov/hipaa/for-professionals/faq/2003/are-we-required-to-certify-our-organizations-compliance-with-the-standards/index.html returned 403; only a search summary was seen).

### LAW-MKT-09 · Paid, affiliate or free-product endorsements with no disclosure (16 CFR 255.5)
- **Applies when:** influencers, affiliates, ambassadors or friends promote the app and get paid, a commission, free access or a chance at a prize; or the app's own pages carry affiliate links. **Does not apply when:** genuinely independent reviews.
- **What it requires:** a material connection the audience wouldn't expect must be disclosed clearly and conspicuously, where people will see it (not behind a "more" link).
- **Exposure:** FTC action against the advertiser and, in some cases, the endorser.
- **Find it:** affiliate or referral code (`grep -ri "affiliate\|referral\|ref=\|rewardful\|tolt\|firstpromoter"`); pages with outbound affiliate links and no disclosure; testimonial sections from people given free access; the owner's influencer briefs.
- **Fix:** disclosure text next to affiliate links ("we earn a commission"); require #ad or "paid partnership" in creator briefs; label comped testimonials. **Who:** Claude (site), owner (creator contracts).
- **Status:** in force.
- **Source:** https://www.law.cornell.edu/cfr/text/16/255.5 · "such connection must be disclosed clearly and conspicuously" and "They can include monetary payment or the provision of free or discounted products" · read 2026-11-16.

### LAW-MKT-10 · Paying for good reviews, hiding bad ones (16 CFR 465.4, 465.7)
- **Applies when:** review requests with a reward, "rate us 5 stars to unlock", or a review widget that only shows the good ones while presenting itself as all reviews. **Does not apply when:** incentives are offered for any honest review, whatever its sentiment; organizing reviews (sorting, filtering by topic) is not suppression.
- **What it requires:** no compensation conditioned on a positive (or negative) sentiment; no suppressing reviews by threats or by hiding negative ones while implying the shown set is complete. On iOS, review prompts go through Apple's API and nothing may be offered for a rating (Apple 5.6.1; manipulation is 5.6.3).
- **Exposure:** civil penalties for knowing violations, up to $53,088 each; App Store removal risk.
- **Find it:** `grep -riE "rating\s*(>=|>|===)\s*[45]|stars?\s*>=|filter.*rating|review.*reward|credits?.*review"`; a testimonials query with `where rating >= 4` on a page titled "what users say"; a custom rate-us modal in an iOS build instead of `SKStoreReviewController`/`requestReview`.
- **Fix:** remove sentiment conditions; show all reviews or label the selection ("featured"); use the platform review API. **Who:** Claude.
- **Status:** in force since October 21, 2024.
- **Source:** https://www.law.cornell.edu/cfr/text/16/465.4 · "for a business to provide compensation or other incentives in exchange for, or conditioned expressly or by implication on, the writing or creation of consumer reviews expressing a particular sentiment" · read 2026-11-16. Apple: https://developer.apple.com/app-store/review/guidelines/.

### LAW-BILL-06 · Card numbers touching your own servers (PCI DSS, SAQ A)
- **Applies when:** you take card payments. **Does not apply when:** Stripe Checkout, Payment Links or Elements collect the card, so card numbers never reach your server; then you are in the lightest tier (SAQ A), but still attest yearly.
- **What it requires:** with Checkout or Elements: SAQ A. Since March 31, 2025, SAQ A also asks the merchant to confirm the site is not susceptible to script attacks that could affect the e-commerce system. Card numbers on your own form posting to your server put you in SAQ A-EP or SAQ D (300+ controls). You may store card brand, last four and expiry (Stripe returns them); never full numbers or CVC.
- **Exposure:** contract, not statute: card networks and Stripe can fine or terminate; breach costs fall on you.
- **Find it:** `grep -riE "card(_)?number|cardNumber|cvc|cvv|pan\b|\b[0-9]{13,19}\b" --include=*.{ts,tsx,js,sql,py}`; inputs named card/cvc outside Stripe Elements; database columns holding card data; logs that print request bodies on the payment route.
- **Fix:** use Checkout or Elements only; drop any card columns; scrub logs; keep third-party scripts off the payment page; complete the SAQ in the Stripe Dashboard (Settings, Compliance). **Who:** Claude (code), owner (attestation).
- **Status:** PCI DSS v4.0.1; revised SAQ A in effect from March 31, 2025.
- **Source:** https://stripe.com/guides/pci-compliance · Checkout and Elements "host all card data collection inputs within an iframe served from Stripe's domain (not yours)" · read 2026-11-16. SAQ A change: https://blog.pcisecuritystandards.org/important-updates-announced-for-merchants-validating-to-self-assessment-questionnaire-a · "confirm their site is not susceptible to attacks from scripts that could affect the merchant's e-commerce system(s)" · read 2026-11-16.

### LAW-BILL-07 · Missing policy pages and a dispute spike (Stripe website checklist, card network rules)
- **Applies when:** you take payments through Stripe. **Does not apply when:** n/a.
- **What it requires:** Stripe's checklist, based on card network rules: a clear description of what you sell, prices with explicit currency, customer service contact (more than a form), refund and cancellation policies, privacy policy, promotion and trial terms visible at the point of agreement. Stripe may contact you if it reviews the site and these are missing. Dispute activity above 0.75% is treated as excessive by the industry; spikes can trigger monitoring programs sooner, and all disputes count, won or lost.
- **Exposure:** paused payouts, reserves, account closure; card network fines.
- **Find it:** routes for `/refund`, `/cancellation`, `/terms`, `/privacy`, `/contact` and footer links to them; checkout `currency` and displayed prices match; `statement_descriptor` set to the product name (22 characters or fewer); terms acceptance logged at checkout; usage caps and alerts on metered plans.
- **Fix:** the pages, the descriptor, receipts on with support email, Radar on, a weekly look at early fraud warnings, refund before a dispute. **Who:** Claude (pages, code), owner (Dashboard settings).
- **Status:** current Stripe policy.
- **Source:** https://docs.stripe.com/disputes/measuring · "The credit card processing industry standard recognizes dispute activity above 0.75% as excessive" · read 2026-11-16. Checklist: https://docs.stripe.com/get-started/checklist/website · read 2026-11-16.

### LAW-BILL-08 · Selling something Stripe does not allow (Stripe restricted businesses)
- **Applies when:** the app's business falls in a listed category. Relevant to AI apps: adult content including AI-generated adult content (prohibited); gambling, including sweepstakes and contests with prizes (prohibited); peer-to-peer money transmission (prohibited) and money services or stored value (restricted, needs review); crypto (restricted); get-rich-quick schemes (prohibited); negative option marketing and trials with unclear pricing (prohibited); telemarketing and MLM (prohibited). **Does not apply when:** ordinary SaaS with clear pricing.
- **What it requires:** don't use Stripe for prohibited categories; get approval first for restricted ones. The list is not exhaustive.
- **Exposure:** account closure, funds held.
- **Find it:** what the app sells, its landing copy, generation filters (does an image generator allow explicit output?), any wallet, credits redeemable for cash, or prize features.
- **Fix:** remove the feature, get Stripe's written approval, or use a processor that serves the category. **Who:** owner.
- **Status:** current Stripe policy.
- **Source:** https://stripe.com/legal/restricted-businesses · "This page provides information on the types of businesses, products, and industries that can't use Stripe's services." · read 2026-11-16.

### LAW-BILL-09 · Price shown is not price charged; personalised prices (FTC Act s.5; 16 CFR 464; N.Y. GBL 349-a)
- **Applies when:** fees added at checkout, prices that differ by user, or a displayed price that doesn't match what Stripe charges. **Does not apply when:** one clear all-in price for everyone. The FTC's Rule on Unfair or Deceptive Fees (16 CFR 464) covers only live-event tickets and short-term lodging, so most apps are outside it; deceptive partial pricing is still reachable under the FTC Act.
- **What it requires:** show the total. In New York, a price set by an algorithm using the user's personal data must carry the statutory disclosure next to it.
- **Exposure:** New York: up to $1,000 per violation. FTC Act: orders and refunds.
- **Find it:** compare UI price constants with Stripe `unit_amount` and `currency`; search for fee lines added late (`grep -ri "service fee\|processing fee\|convenience fee"`); pricing logic keyed on user history, device or location (`grep -riE "price.*(user|device|geo|country)|dynamicPric"`).
- **Fix:** one source of truth for prices (Stripe Price IDs rendered in the UI); fold fees into the shown price; per-user pricing either removed or labelled with "THIS PRICE WAS SET BY AN ALGORITHM USING YOUR PERSONAL DATA" for New York users. **Who:** Claude; lawyer if pricing is personalised at scale.
- **Status:** in force (NY law in effect since November 10, 2025; statute text read today).
- **Source:** https://www.nysenate.gov/legislation/laws/GBS/349-A · "THIS PRICE WAS SET BY AN ALGORITHM USING YOUR PERSONAL DATA" · read 2026-11-16. Fees rule scope: https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-464 · "Covered good or service means: (1) Live-event tickets; or (2) Short-term lodging" · read 2026-11-16.

### LAW-BILL-10 · No refund policy, or a bot that invents one (Stripe checklist; ROSCA material terms)
- **Applies when:** any paid app. **Does not apply when:** n/a. This file found no general US statute requiring refunds for digital services; what binds you is the policy you publish, ROSCA's material-terms duty for subscriptions, EU rules (BILL-11) and card network rules.
- **What it requires:** a written refund policy with a number of days and how to ask; the same policy everywhere (site, receipts, support bot). A support chatbot that states refunds you don't offer can bind you (Moffatt v. Air Canada, 2024 BCCRT 149; covered in the AI file).
- **Exposure:** disputes and chargebacks (BILL-07); deception claims if practice differs from policy.
- **Find it:** `/refund` page; refund code path (`refunds.create`) reachable by an admin; chatbot system prompt allowing it to state prices or refunds (`grep -ri "system.*prompt" ` then read).
- **Fix:** write the policy about the actual product; an admin refund button; system prompt forbids stating refunds or prices and links the policy page. **Who:** Claude drafts, owner sets the terms.
- **Status:** in force (contract and card rules).
- **Source:** https://docs.stripe.com/get-started/checklist/website · "Refund policy: Describe the conditions under which customers can receive a refund." · read 2026-11-16.

### LAW-BILL-11 · Selling to EU consumers: 14 days to withdraw, order button, withdrawal button (Directive 2011/83/EU)
- **Applies when:** you sell online to consumers in the EU (national laws implement the Directive; the trader's location does not take you out). **Does not apply when:** business customers only, or no EU sales.
- **What it requires:** 14 days to withdraw without reason. A service can lose the right once fully performed, and digital content not on a tangible medium can lose it once supply starts, but only with the consumer's prior express consent and acknowledgement, and a confirmation. Pre-contract information (price, duration, renewal, how to withdraw). The pay button must say "order with obligation to pay" or an unambiguous equivalent ("Pay now", "Subscribe and pay"). From June 19, 2026, online contracts need a withdrawal function labelled "withdraw from contract here" or equivalent, prominent and available for the whole withdrawal period, with a "confirm withdrawal" step and an acknowledgement on a durable medium.
- **Exposure:** national consumer authorities; for widespread infringements, fines of at least 4% of annual turnover in the member states concerned must be available.
- **Find it:** checkout button text; whether the checkout asks EU users to consent to immediate access and acknowledge losing withdrawal; a withdrawal function in account settings for EU users within 14 days of purchase; the confirmation email content.
- **Fix:** button text "Subscribe and pay"; a checkbox "I want access now and understand I lose my 14-day right of withdrawal once access starts"; a "Withdraw from contract here" link for EU orders inside 14 days leading to a confirm step and an emailed receipt. **Who:** Claude; lawyer for EU-heavy businesses. UK: a separate subscription regime under the DMCC Act is set for January 2027 (draft regulations).
- **Status:** in force; withdrawal function from June 19, 2026.
- **Source:** https://eur-lex.europa.eu/eli/dir/2023/2673/oj/eng · "The withdrawal function shall be labelled with the words 'withdraw from contract here' or an unambiguous corresponding formulation" and "They shall apply those measures from 19 June 2026." · read 2026-11-16. Base directive: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02011L0083-20220528 · "the consumer shall have a period of 14 days to withdraw from a distance or off-premises contract, without giving any reason" · read 2026-11-16.

### LAW-MKT-11 · EU and UK marketing email without opt-in (ePrivacy Art. 13; PECR reg. 22)
- **Applies when:** marketing email or SMS to individuals in the EU or UK. **Does not apply when:** transactional mail; or the soft opt-in: you got the address while selling (or negotiating a sale) to that person, you market only your own similar products, and you offered a free, simple refusal at collection and in every message.
- **What it requires:** prior opt-in consent for everyone else (a newsletter signup with an unticked box or a clear "subscribe" action).
- **Exposure:** UK: ICO fines under PECR up to £17.5 million or 4% of global turnover since the Data (Use and Access) Act 2025 commenced. EU: national regulators.
- **Find it:** signup forms adding users to marketing lists by default (`marketing: true`, pre-checked boxes); lead magnets or waitlists feeding promotional sequences without a consent field; no per-contact consent source stored.
- **Fix:** separate, unticked marketing checkbox; store consent source and time; soft opt-in only for paying customers, with an opt-out at signup. **Who:** Claude.
- **Status:** in force.
- **Source:** https://www.legislation.gov.uk/uksi/2003/2426/regulation/22 · "the recipient has been given a simple means of refusing (free of charge except for the costs of the transmission of the refusal) the use of his contact details" · read 2026-11-16. ICO fines: https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/02/statement-on-the-commencement-of-the-data-use-and-access-act-duaa/ · "issue fines of up to £17.5 million or 4% of global turnover under the Privacy and Electronic Communications Regulations (PECR)" · read 2026-11-16 (search excerpt of the ICO page). EU: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219 · read 2026-11-16.

### LAW-MKT-12 · Canadian recipients (CASL)
- **Applies when:** commercial electronic messages (email, SMS, DMs) to people in Canada. **Does not apply when:** no Canadian recipients, or purely transactional messages.
- **What it requires:** consent (express, or implied in listed cases such as a recent purchase), sender identification, and an unsubscribe mechanism valid for at least 60 days, processed within 10 business days. The sender must prove consent.
- **Exposure:** administrative penalties up to $1 million per violation for individuals and $10 million for businesses (CRTC).
- **Find it:** as LAW-MKT-11; also whether the consent record holds the date and source.
- **Fix:** opt-in checkbox for Canada (or everyone), sender details in the footer, unsubscribe honored within 10 business days. **Who:** Claude.
- **Status:** in force.
- **Source:** https://laws-lois.justice.gc.ca/eng/acts/E-1.6/FullText.html (section 20(4)) · "The maximum penalty for a violation is $1,000,000 in the case of an individual, and $10,000,000 in the case of any other person." · read 2026-11-16.

### LAW-MKT-13 · State texting laws (Florida 501.059 and other mini-TCPAs)
- **Applies when:** marketing texts to people in states with their own telemarketing laws. Florida's covers texts and has its own private action. **Does not apply when:** no marketing texts.
- **What it requires:** in Florida, prior express written consent for automated sales texts (a checkbox counts as a signature); honor a STOP reply; a plaintiff must first reply STOP and wait 15 days before suing over texts.
- **Exposure:** Florida: actual damages or $500, whichever is greater, up to three times if willful, plus attorney's fees to the prevailing party.
- **Find it:** as LAW-MKT-02.
- **Fix:** meeting TCPA written consent and STOP handling covers most of it; a lawyer for programs aimed at a single state. **Who:** Claude, lawyer for large programs.
- **Status:** in force.
- **Source:** http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0501/Sections/0501.059.html · "Recover actual damages or $500, whichever is greater." · read 2026-11-16.

### LAW-MKT-14 · Unregistered SMS sender (carriers' A2P 10DLC)
- **Applies when:** app-to-person texts to US numbers from a 10-digit long code. A carrier requirement, not a law. **Does not apply when:** toll-free numbers or short codes, which have their own verification.
- **What it requires:** register a brand and a campaign (use case, sample messages, opt-in description) with the provider before sending.
- **Exposure:** filtered or blocked messages, carrier fees.
- **Find it:** the sending number type in config (`TWILIO_PHONE_NUMBER`, Messaging Service SID); ask the owner whether the campaign is registered and its opt-in description matches the real signup flow.
- **Fix:** register in the provider console; make the described opt-in match the code. **Who:** owner.
- **Status:** current carrier policy.
- **Source:** https://help.twilio.com/articles/1260800720410-What-is-A2P-10DLC- · "if you send SMS or MMS to U.S. phone numbers using long code numbers, you need to register for A2P 10DLC" · read 2026-11-16.

### LAW-BILL-12 · Digital goods sold around the app store (Apple 3.1.1, Google Play Payments)
- **Applies when:** a mobile app unlocks digital features or content for money. **Does not apply when:** physical goods or services used outside the app; web-only apps.
- **What it requires:** Apple: unlocking features or content needs in-app purchase, except that apps on the United States storefront may include buttons and external links to other purchase methods. Google Play: in-app digital purchases use Play Billing unless enrolled in an alternative billing or external offers program where eligible.
- **Exposure:** rejection or removal.
- **Find it:** Stripe Checkout links or "buy on our website" inside the mobile build; which storefronts the app ships to; a paywall with no Restore Purchases (see app-store file).
- **Fix:** StoreKit/Play Billing (or RevenueCat) for digital unlocks; external links only on the US storefront or under an enrolled program. **Who:** Claude (code), owner (store programs).
- **Status:** current store rules.
- **Source:** https://developer.apple.com/app-store/review/guidelines/ · "If you want to unlock features or functionality within your app ... you must use in-app purchase." and "except for the United States storefront, where this prohibition does not apply" · read 2026-11-16. Google: https://support.google.com/googleplay/android-developer/answer/9858738 · read 2026-11-16.

### LAW-MKT-15 · Naming competitors (FTC comparative advertising policy, 16 CFR 14.15)
- **Applies when:** "better than ChatGPT", comparison tables, competitor names in ads or keywords. **Does not apply when:** no comparisons.
- **What it requires:** comparisons are allowed and encouraged if truthful, clear and substantiated, judged like any other claim. Competitors can also sue under the Lanham Act for false comparative claims; using their logo or implying endorsement raises trademark issues. Apple separately rejects competitor names stuffed into app metadata (2.3.7).
- **Exposure:** FTC action; competitor lawsuits.
- **Find it:** `grep -riE "vs\.?|versus|better than|compared to|alternative to" content/ app/`; competitor logos in `public/`.
- **Fix:** keep only comparisons with dated, reproducible evidence; no competitor logos; plain text names. **Who:** Claude drafts, lawyer for aggressive comparison campaigns.
- **Status:** in force.
- **Source:** https://www.law.cornell.edu/cfr/text/16/14.15 · "Comparative advertising, when truthful and nondeceptive, is a source of important information to consumers" · read 2026-11-16.

### LAW-MKT-16 · Giveaways that require a purchase or skip registration (N.Y. GBL 369-e; Fla. Stat. 849.094)
- **Applies when:** sweepstakes or giveaways with prizes, especially "buy to enter" or large prize pools. New York and Florida require registration and a bond or trust when total announced prizes exceed $5,000 (New York 30 days before, Florida 7 days before). **Does not apply when:** prize total under those thresholds and free entry; skill contests have different rules.
- **What it requires:** no purchase or entry fee as a condition of entering (a free method of entry); official rules; registration and bonding above thresholds. Stripe prohibits sweepstakes and contests with prizes on its platform (BILL-08).
- **Exposure:** state enforcement; an illegal lottery if purchase is required.
- **Find it:** giveaway pages, "enter to win", referral contests tied to paid plans.
- **Fix:** free entry route, written official rules, registration where needed. **Who:** lawyer for anything over the thresholds or national in scope.
- **Status:** in force.
- **Source:** https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0800-0899/0849/Sections/0849.094.html · "To require an entry fee, payment, or proof of purchase as a condition of entering a game promotion." · read 2026-11-16. New York: https://www.nysenate.gov/legislation/laws/GBS/369-E · "shall file with the secretary of state, at least thirty days prior to the commencement of such game, contest or promotion" · read 2026-11-16.

### LAW-BILL-13 · Sales tax and VAT on digital goods (South Dakota v. Wayfair; EU VAT OSS)
- **Applies when:** selling digital goods or SaaS across US states or to EU consumers. Since Wayfair (2018), states can require collection without physical presence; South Dakota's threshold was $100,000 of sales or 200 transactions a year, and each state sets its own and decides whether SaaS is taxable. EU: VAT on electronically supplied services to consumers is declared per customer country; non-EU sellers can use the non-Union OSS. **Does not apply when:** below every state's threshold and no EU consumer sales (check, don't assume).
- **What it requires:** know where you have nexus, register, collect, file.
- **Exposure:** back taxes, interest, penalties.
- **Find it:** Stripe Tax enabled? (`automatic_tax: { enabled: true }` in Checkout sessions); customer location collected; ask the owner for sales by state and country.
- **Fix:** turn on Stripe Tax monitoring, or a merchant of record (Paddle, Lemon Squeezy) that handles it; registrations with an accountant. **Who:** owner and accountant.
- **Status:** in force.
- **Source:** https://www.law.cornell.edu/supremecourt/text/17-494 · Quill and Bellas Hess "should be, and now are, overruled"; the Act covers sellers who "deliver more than $100,000 of goods or services into the State or engage in 200 or more separate transactions" · read 2026-11-16. EU: https://vat-one-stop-shop.ec.europa.eu/one-stop-shop/declare-and-pay-oss_en · "supplies of services to non-taxable persons taking place in the EU" · read 2026-11-16.

### LAW-BILL-14 · Holding or moving users' money (money transmission, 31 CFR 1010.100(ff)(5))
- **Applies when:** the app accepts money from one user and pays it to another (marketplace payouts done by you, wallets, balances redeemable for cash, tipping you pass on). **Does not apply when:** Stripe Connect (or similar) moves the funds directly to connected accounts and you never hold them; or credits usable only in your own app and never cashable.
- **What it requires:** federal registration as a money services business and state licences can apply. Facts decide it; this file does not.
- **Exposure:** federal and state penalties for unlicensed money transmission; Stripe prohibits peer-to-peer transmission (BILL-08).
- **Find it:** a `balance`/`wallet` table that users can withdraw from; payouts sent from your own account to users; transfers between users.
- **Fix:** route through Stripe Connect with funds flowing to connected accounts; stop cash-out of credits. **Who:** lawyer, before launch.
- **Status:** in force.
- **Source:** https://www.law.cornell.edu/cfr/text/31/1010.100 · "The term 'money transmission services' means the acceptance of currency, funds, or other value that substitutes for currency from one person and the transmission of currency, funds, or other value that substitutes for currency to another location or person by any means." · read 2026-11-16.

## Not covered here
- Privacy policies, cookie banners, pixels and wiretap suits (CIPA, VPPA), health data, BIPA: the privacy and tracking files.
- Chatbot policy guardrails (Moffatt v. Air Canada), AI labels, companion-bot laws, AI therapy bans: the AI file. BILL-10 points there.
- Restore Purchases, test keys in release builds, EU trader status on store pages, store review prompts beyond MKT-10: the app-store file.
- Webhook signature checks and client-trusted prices (including the $0.00 order in one audit of two AI-built sites): security files.
- Telemarketing Sales Rule, Do Not Call registry scrubbing, fax rules: rare for these apps; voice calls are out of scope.
- Every state auto-renewal law one by one; California is used as the strict floor.
- Lanham Act and trademark detail, influencer contract terms, international sweepstakes: lawyer territory.

## Open questions
- **NYC click-to-cancel rule:** secondary sources say adopted July 2026 and effective October 1, 2026; the DCWP notice of adoption PDF could not be read as text today, and the nyc.gov release seen covers only the April proposal and fines "starting at $525". Confirm against the City Record.
- **FCC September 30, 2026 TCPA order:** adopted per a law firm report; effective 30 days after Federal Register publication, not yet published per that report. When it takes effect, MKT-03's "no exclusive opt-out method" line changes. Re-check the eCFR text.
- **California ARL remedies (BPC 17603, 17604):** pages returned 403; exposure left unstated.
- **UK DMCC penalty ceiling (10% of global turnover, as often quoted):** sections 143 and 237 opened today do not state it; the penalty schedule was not located. UK subscription regime: draft regulations point to January 1, 2027, not yet made.
- **HHS on "HIPAA certified" claims:** the FAQ page returned 403; only a search summary was seen.
- **CAN-SPAM statute text (15 U.S.C. 7704):** the FTC compliance guide was used instead of the statute; consistent but not the primary text.
- **Whether a new FTC negative option NPRM has issued since the March 2026 ANPRM:** none found in today's search.
