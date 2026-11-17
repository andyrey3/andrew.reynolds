# Legal: tracking pixels, session replay and sensitive data (TRACK, SENS)

Scope. This file covers the lawsuits a small app actually gets over the scripts it loads (ad pixels, analytics, session
replay, chat widgets, embedded video) and over the sensitive data it collects (faces and voices, health, precise location,
sexual orientation and similar categories, financial and screening data). Most of these claims are brought by plaintiff
firms that scan sites and record network traffic, so the evidence is whatever a stranger can see in a browser. The code is
the defence: what loads, on which page, before or after consent, carrying what. Courts are split on a lot of this, and
each entry says so. None of this is legal advice; a finding here is a reason to fix the code and, where marked, to call a
lawyer. Read on 2026-11-16 unless stated.

Shared finding steps used below (run once, reuse):
- **Script inventory.** Search the repo: `fbq(`, `connect.facebook.net`, `gtag(`, `googletagmanager.com`, `GTM-`,
  `@next/third-parties`, `analytics.tiktok.com`, `ttq.`, `snap.licdn.com`, `px.ads.linkedin.com`, `clarity.ms`, `hotjar`,
  `fullstory`, `logrocket`, `mouseflow`, `smartlook`, `replayIntegration`, `posthog`, `mixpanel`, `amplitude`, `segment`,
  `intercom`, `crisp`, `tawk`, `drift`, `zendesk`, `hubspot`. Open the root layout (`app/layout.tsx`, `pages/_app.tsx`,
  `pages/_document.tsx`, `index.html`) and any tag-manager container export. Check `package.json` for the same names.
- **Consent gate.** For each script, find the condition that loads it. A bad result: a `<Script>` or `<script>` in the
  layout with no consent check, or a banner component that only hides itself.
- **Live check (harmless, own site).** Private window, DevTools Network open, load the home page and one page of each
  type (video, health, checkout, chat) without touching the banner. Filter for `facebook|google|tiktok|clarity|hotjar|
  posthog|mixpanel|segment`. Any request before a click is a pre-consent load. Open one request and read its query string
  and payload for page URLs, titles, emails, form values or video names.

## Contents
- LAW-TRACK-01 · Pixels and chat scripts that read what visitors do, without consent (CIPA 631)
- LAW-TRACK-02 · Pixels as a "pen register" (CIPA 638.51; private suits end for websites under SB 690)
- LAW-TRACK-03 · Session replay recording every click and keystroke
- LAW-TRACK-04 · Chat widgets, recorded calls and AI voice agents
- LAW-TRACK-05 · A pixel on a page with video (VPPA, 18 U.S.C. 2710)
- LAW-TRACK-06 · Health or other sensitive details riding along in pixel events (FTC Act, HBNR, HIPAA)
- LAW-TRACK-07 · Other states' wiretap and records laws (Pennsylvania, Florida, Massachusetts, Arizona)
- LAW-SENS-01 · Face, voice and selfie features (Illinois BIPA, 740 ILCS 14)
- LAW-SENS-02 · Face and voice in Texas and Washington (Tex. Bus. & Com. Code 503.001; RCW 19.375)
- LAW-SENS-03 · Health data outside HIPAA in Washington (My Health My Data Act, RCW 19.373)
- LAW-SENS-04 · Health apps leaking data count as a breach (FTC Health Breach Notification Rule, 16 CFR 318)
- LAW-SENS-05 · When HIPAA applies to an app and when it does not
- LAW-SENS-06 · Precise location, sexual orientation, immigration status and other "sensitive data" (state privacy laws)
- LAW-SENS-07 · Money apps that may be a "financial institution" (GLBA Safeguards Rule)
- LAW-SENS-08 · Background, employment or tenant screening (FCRA): lawyer flag

---

### LAW-TRACK-01 · Pixels and chat scripts that read what visitors do, without consent (Cal. Penal Code 631)
- **Applies when:** any site or app that California residents use loads a third-party script (Meta Pixel, TikTok Pixel,
  Google tags, chat vendor) that receives page URLs, search terms, form fields or messages. No revenue or user-count
  threshold. **Does not apply when:** nothing third-party loads before the visitor agrees, or the only scripts are
  first-party analytics you host yourself that no vendor can read. Courts disagree on how far 631 reaches internet
  traffic (see Status).
- **What it requires:** do not let a third party read or learn the contents of a visitor's communication with your site
  while it is in transit without consent of all parties. The site owner is sued for "aiding" the vendor.
- **Exposure:** private suit for the greater of $5,000 per violation or three times actual damages; no proof of harm
  needed (Penal Code 637.2). Class actions multiply it per visitor. Often quoted as "$5,000 per visitor": the statute
  says per violation; plaintiffs count visits. Federal courts now often dismiss for lack of a concrete injury (TRACK-03).
- **Find it:** script inventory and consent gate (top of file). Worst signs: the pixel in the root layout; Google tags
  with no `gtag('consent','default', ...)` set to denied before load; Meta "Automatic Advanced Matching" or custom events
  that send email, phone or form text; search queries in the page URL that the pixel forwards.
- **Fix:** load every non-essential script only after an opt-in click (a consent manager that blocks, not hides; in
  Next.js render the `<Script>` only when consent state is true). Set Google Consent Mode defaults to denied. Strip query
  strings and form values from pixel events. Name each vendor in the privacy policy. **Who:** Claude (code), owner (choose
  and configure the consent tool).
- **Status:** in force. Unsettled: a Ninth Circuit concurrence argued the first clause of 631 does not cover internet
  messages, and the panel held "could read" is not "read in transit" (Gutierrez v. Converse, unpublished, 9th Cir. July
  9, 2025, https://cdn.ca9.uscourts.gov/datastore/memoranda/2025/07/09/24-4797.pdf).
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=631 · "willfully
  and without the consent of all parties to the communication, or in any unauthorized manner, reads, or attempts to read,
  or to learn the contents" · read 2026-11-16. Damages: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=637.2
  · "Five thousand dollars ($5,000) per violation." · read 2026-11-16

### LAW-TRACK-02 · Pixels as a "pen register" (Cal. Penal Code 638.51; SB 690 of 2026)
- **Applies when:** a tracker collects "routing, addressing, or signaling information" (IP address, device ID) of
  California visitors. This was the cheapest demand letter of 2024 to 2026 because it does not need message contents.
  **Does not apply when:** from SB 690's operative date, a private plaintiff sues over conduct on a website or app; only
  the Attorney General can bring that claim, and the change reaches pending claims filed within two years before.
- **What it requires:** no pen register or trap and trace device without a court order, unless the user consented.
- **Exposure:** before SB 690: $5,000 per violation through 637.2. After: Attorney General actions only, for website,
  online app and mobile app conduct. Criminal fine up to $2,500 remains in 638.51(c).
- **Find it:** same as TRACK-01. Fingerprinting or "identity resolution" scripts (for example scripts sold to reveal who a
  visitor is) are the core target; grep for vendors whose docs promise to identify anonymous visitors.
- **Fix:** the same consent gate as TRACK-01 closes it. If the owner already has a 638.51 demand letter, send it to a
  lawyer with the SB 690 text. **Who:** Claude (code), lawyer (pending letters).
- **Status:** SB 690 approved by the Governor and chaptered September 30, 2026 (Chapter 976, Statutes of 2026). It
  carries no urgency clause, so its operative date is likely January 1, 2027 (see Open questions).
- **Source:** https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260SB690 · "An action against a
  private actor for a violation of Section 638.51 alleged to arise from conduct occurring on an internet website, online
  application, or mobile application may be brought under this section only by the Attorney General." · read 2026-11-16.
  Definition: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=638.50 ·
  "records or decodes dialing, routing, addressing, or signaling information ... but not the contents of a communication" · read 2026-11-16

### LAW-TRACK-03 · Session replay recording every click and keystroke (CIPA 631, state wiretap acts)
- **Applies when:** the app runs a session-replay SDK: Microsoft Clarity, Hotjar, FullStory, LogRocket, Mouseflow,
  Smartlook, Sentry Replay (`replayIntegration`), PostHog or Mixpanel session recording. **Does not apply when:** replay
  is off, or it starts only after consent and masks all inputs. Two federal appeals courts dismissed replay suits where
  the visitor typed nothing sensitive, so the risk is highest on pages with health, money or identity fields.
- **What it requires:** the same consent as TRACK-01; the replay captures typed text, which is "contents".
- **Exposure:** as TRACK-01 in California; Pennsylvania and Florida statutes in TRACK-07.
- **Find it:** `package.json` and init code for the SDKs above. Read the init options: is input masking on for every
  field, are recordings sampled on sign-up, checkout or health pages, does recording start before consent?
- **Prove it:** live check on a form page: type a dummy value into a field, then look for the replay vendor's request
  and whether the dummy value appears in it.
- **Fix:** gate the SDK on consent; mask all inputs and text by default; exclude sign-up, checkout, account and any
  health or chat pages from recording; set a short retention in the vendor dashboard. **Who:** Claude (code), owner
  (vendor settings).
- **Status:** in force; standing is the main defence and it depends on what was captured.
- **Source:** https://cdn.ca9.uscourts.gov/datastore/opinions/2025/08/26/24-14.pdf (Popa v. Microsoft, 9th Cir. Aug. 26,
  2025, published) · "Popa failed to allege a 'concrete' injury sufficient to support Article III standing." · read
  2026-11-16. Also Cook v. GameStop, 3d Cir. Aug. 7, 2025, https://www2.ca3.uscourts.gov/opinarch/232574p.pdf · "she did not
  input any sensitive or personal information" · read 2026-11-16

### LAW-TRACK-04 · Chat widgets, recorded calls and AI voice agents (CIPA 631, 632.7)
- **Applies when:** a third-party chat widget (Intercom, Drift, Zendesk, Crisp, tawk.to, a hosted AI chatbot) stores or
  analyses visitor messages; or the app records or transcribes phone calls, including an AI voice agent that answers
  calls from mobile phones. **Does not apply when:** the vendor only stores messages for you and cannot use them, and the
  widget discloses recording at the start (the Converse case turned on proof that the vendor actually read messages).
- **What it requires:** consent of all parties before a third party reads chat contents in transit; for calls involving
  a cellular or cordless phone, consent of all parties before intercepting and recording.
- **Exposure:** $5,000 per violation (637.2) for each.
- **Find it:** the widget's init in the layout; the AI chat route (`/api/chat`) and which vendor gets the messages; any
  telephony SDK (Twilio, Vapi, Retell, Bland) and whether `record` or transcription is on; the first message or greeting
  text.
- **Fix:** a visible line before the first message ("This chat is recorded and handled by <vendor> and an AI model") with
  continuing use as consent, plus the same in the privacy policy; for calls, a recorded disclosure at the start of every
  call before recording begins. Turn off vendor training on chat data where the vendor offers it. **Who:** Claude (text,
  code), owner (vendor settings).
- **Status:** in force; unsettled as above.
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PEN&sectionNum=632.7 · "without
  the consent of all of the parties to a communication, intercepts or receives and intentionally records" · read 2026-11-16

### LAW-TRACK-05 · A pixel on a page with video (Video Privacy Protection Act, 18 U.S.C. 2710)
- **Applies when:** the business delivers prerecorded video (courses, a video library, clips on a media site) and a pixel
  on the video page sends the video's title or URL together with an identifier such as a Facebook ID or email to a third
  party. **Does not apply when:** the app has no prerecorded video, the pixel does not load on video pages, or the
  disclosure carries nothing that identifies the person.
- **What it requires:** no knowing disclosure of which videos a "consumer" watched without informed, written consent in a
  form "distinct and separate" from other terms (a checkbox inside the terms of service is not enough).
- **Exposure:** actual damages but not less than $2,500 liquidated damages per person, plus fees; private suits.
- **Find it:** grep `<video`, `react-player`, `mux`, `vimeo`, `wistia`, `youtube.com/embed`, course or lesson routes.
  Check whether the pixel fires on those routes and whether its events carry the page title or a `content_name`.
- **Fix:** no ad pixel on video pages, or strip title and URL from events there; if the owner wants video-level ad
  targeting, a separate opt-in screen that meets 2710(b)(2)(B). **Who:** Claude (code), lawyer (if they want to keep
  sharing).
- **Status:** in force. Circuit split on who is a "consumer": the Second and Seventh Circuits count a subscriber to any
  service (even a newsletter); the Sixth and D.C. Circuits require an audiovisual service. The Supreme Court heard
  Salazar v. Paramount Global (No. 25-459) on October 14, 2026; no decision as of 2026-11-16.
- **Source:** https://www.law.cornell.edu/uscode/text/18/2710 · "actual damages but not less than liquidated damages in
  an amount of $2,500" · read 2026-11-16. Docket: https://www.supremecourt.gov/search.aspx?filename=/docket/docketfiles/html/public/25-459.html
  · "Argued. For petitioner: Joshua I. Hammack" · read 2026-11-16

### LAW-TRACK-06 · Health or other sensitive details riding along in pixel events (FTC Act 5, HBNR, HIPAA)
- **Applies when:** a pixel or analytics SDK loads on pages or events that reveal health, prescriptions, mental health,
  sexuality or money trouble: intake quizzes, symptom or mood fields, "book a therapist", a period or fertility log. No
  size threshold for the FTC Act. **Does not apply when:** no third-party tracker sees those pages or fields.
- **What it requires:** do not share sensitive data with ad platforms contrary to what you told users; health apps
  outside HIPAA must treat unauthorized sharing as a breach (SENS-04); HIPAA entities have their own tracking rules
  (SENS-05).
- **Exposure:** FTC orders and civil penalties. BetterHelp: $7.8 million to consumers and a ban on sharing health data
  for ads. GoodRx: $1.5 million civil penalty, the first under the Health Breach Notification Rule. Plus Washington's private right of action (SENS-03).
- **Find it:** grep for `track(`, `fbq('track'`, `gtag('event'`, `posthog.capture`, `mixpanel.track` and list every
  property sent; flag any that names a condition, medication, answer to a quiz, or a page title containing one. Live
  check on the intake or health pages.
- **Fix:** an allowlist of event names and properties that may leave the app (everything else dropped before the SDK);
  no ad pixel on health, intake, booking or results pages; server-side analytics with sensitive fields removed if the
  owner needs numbers. **Who:** Claude.
- **Status:** in force.
- **Source:** https://www.ftc.gov/news-events/news/press-releases/2023/03/ftc-ban-betterhelp-revealing-consumers-data-including-sensitive-mental-health-information-facebook
  · "BetterHelp used and revealed consumers' email addresses, IP addresses, and health questionnaire information to
  Facebook, Snapchat, Criteo, and Pinterest for advertising purposes" · read 2026-11-16. GoodRx:
  https://www.ftc.gov/news-events/news/press-releases/2023/02/ftc-enforcement-action-bar-goodrx-sharing-consumers-sensitive-health-info-advertising
  · "GoodRx will pay a $1.5 million civil penalty" · read 2026-11-16

### LAW-TRACK-07 · Other states' wiretap and records laws (Pennsylvania, Florida, Massachusetts, Arizona)
- **Applies when:** the same pixels, replay and email tracking as above, with users in these states. **Does not apply
  when:** the consent gate from TRACK-01 is in place and marketing emails carry no tracking pixel (or disclose it).
- **What each says, one line each:**
  - Pennsylvania (WESCA, 18 Pa.C.S. 5701 et seq.): used against session replay; the Third Circuit dismissed for lack of
    standing where nothing sensitive was typed, and said other plaintiffs might still sue (Cook v. GameStop, above).
  - Florida (Security of Communications Act, ch. 934): federal courts dismissed the 2021 wave of session-replay suits
    (Goldstein v. Costco, S.D. Fla. 2021, https://www.govinfo.gov/content/pkg/USCOURTS-flsd-9_21-cv-80601/pdf/USCOURTS-flsd-9_21-cv-80601-1.pdf
    · "creative class action litigants have seized on a novel reading of Florida's decades-old wiretapping statute").
  - Massachusetts (G.L. c. 272, s. 99): the Supreme Judicial Court held the wiretap act does not clearly cover web
    browsing tracking (Vita v. New England Baptist Hospital, SJC-13542, Oct. 2024).
  - Arizona (Telephone, Utility and Communication Service Records Act, A.R.S. 44-1376): used against email open-tracking
    pixels; the Court of Appeals rejected that use in Smith v. Target (Nov. 2025).
- **Exposure:** statutory damages under each act; demand letters are the usual form.
- **Find it:** email templates (Resend, SendGrid, Mailchimp) with open tracking on; replay SDKs as TRACK-03.
- **Fix:** the TRACK-01 and TRACK-03 fixes; name email open tracking in the privacy policy or turn it off for marketing
  mail. **Who:** Claude, owner (email tool setting).
- **Status:** in force; all four are trending against plaintiffs on these theories as of 2026-11-16.
- **Source:** https://www.azcourts.gov/Portals/0/OpinionFiles/Div1/2025/CV25-0120%20Smith%20v.%20Target%20OP%20Final%20(11112025).pdf
  · "sending marketing emails and collecting information through tracking pixels [dash] simply is not covered by the [statute]."
  · read 2026-11-16. Massachusetts: https://law.justia.com/cases/massachusetts/supreme-court/2024/sjc-13542.html (Justia's
  summary, not the opinion's words) · "the wiretap act does not unambiguously prohibit the interception of web browsing
  activities" · read 2026-11-16

---

### LAW-SENS-01 · Face, voice and selfie features (Illinois BIPA, 740 ILCS 14)
- **Applies when:** a private business collects a "biometric identifier" (retina or iris scan, fingerprint, voiceprint,
  scan of hand or face geometry) or information derived from one, from anyone in Illinois. Face login, liveness or ID
  checks, "make an avatar from your selfie", voice cloning, speaker ID. Sending user photos or voice to an AI API that
  builds a face or voice template counts as collecting it through a vendor. No revenue or size threshold. **Does not
  apply when:** photos are stored or shown but nothing computes face geometry or a voiceprint; the feature is blocked for
  Illinois users; government bodies.
- **What it requires:** before collection, inform the person in writing what is collected, why and for how long, and get
  a written release (an electronic signature counts after the 2024 amendment); publish a retention and destruction
  schedule (destroy when the purpose ends, and within 3 years of the last interaction at the latest); never sell or
  profit from it; disclose to vendors only with consent.
- **Exposure:** private suit: $1,000 per negligent violation, $5,000 per intentional or reckless one, or actual damages
  if greater, plus fees. Since Public Act 103-0769 (effective August 2, 2024), repeated collection from the same person by
  the same method is one violation with one recovery (this replaced the per-scan accrual of Cothron v. White Castle).
  Often quoted as "per scan": out of date since August 2024; it is now per person per method.
- **Find it:** grep `face-api`, `faceLandmarks`, `mediapipe`, `rekognition`, `azure.*face`, `faceio`, `persona`, `onfido`,
  `veriff`, `liveness`, `voice_clone`, `elevenlabs`, `voices/add`, `speaker`, `embedding` on images or audio. Check the
  sign-up or upload screen for a written notice and a consent checkbox before capture.
- **Fix:** a consent screen before capture that names the data, the purpose, the vendor and the retention period, with an
  unchecked box or signature; a published biometric retention policy; a deletion job that actually runs (and a log that
  it ran); geo-block the feature for Illinois if the owner will not do this. **Who:** Claude (screens, deletion job),
  lawyer (wording of the release, vendor contract).
- **Status:** in force; amended 2024.
- **Source:** https://ilga.gov/Legislation/publicacts/view/103-0769 · UNVERIFIED: ilga.gov failed a TLS certificate check
  from this machine on 2026-11-16, so the operative text was confirmed only through a search-index summary of 740 ILCS 14/20
  and the Public Act ("one violation ... at most, one recovery"); open the page and paste the quote before relying on it.
  The $1,000 and $5,000 figures match the Act's Section 20 as summarized; not quoted from the page.

### LAW-SENS-02 · Face and voice in Texas and Washington (Tex. Bus. & Com. Code 503.001; RCW 19.375)
- **Applies when:** a face or voice feature captures identifiers of Texas or Washington residents for a commercial
  purpose. **Does not apply when:** no template is computed (as SENS-01).
- **What it requires:** notice and consent before capture or enrollment; reasonable care; destroy on a schedule (Texas:
  no later than one year after the purpose expires, per the Attorney General's summary).
- **Exposure:** Attorney General only, no private suits. Texas: up to $25,000 per violation (Meta settled for $1.4
  billion). Washington: Consumer Protection Act enforcement by the Attorney General.
- **Find it / Fix:** same as SENS-01; one consent screen can satisfy all three states. **Who:** Claude, lawyer.
- **Status:** in force.
- **Source:** https://app.leg.wa.gov/RCW/default.aspx?cite=19.375&full=true · "This chapter may be enforced solely by the
  attorney general." · read 2026-11-16. Texas: https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint/consumer-privacy-rights/biometric-identifier-act
  · UNVERIFIED quote: $25,000 per violation taken from a search summary of this page and of the AG's petition against
  Google; the statute page did not render.

### LAW-SENS-03 · Health data outside HIPAA in Washington (My Health My Data Act, RCW 19.373)
- **Applies when:** the app collects "consumer health data" from a Washington resident or in Washington: symptoms, mood,
  conditions, medications, fitness or diet goals tied to health, reproductive or sexual health, biometric or genetic
  data, and precise location that could show someone seeking care. No revenue threshold; a "small business" only got a
  later start date (June 30, 2024). **Does not apply when:** data is HIPAA-protected health information, or the app has
  no Washington users and does not collect data in Washington.
- **What it requires:** consent for a specified purpose before collecting (unless necessary for the service the person
  asked for), a separate consent before sharing, a consumer health data privacy policy linked from the home page, no
  geofence within 2,000 feet of a health care facility to track or target people.
- **Exposure:** a violation is an unfair practice under the Consumer Protection Act (RCW 19.86): Attorney General suits
  and private suits. The figures "$7,500 per violation" and "actual damages, trebled" are often quoted; the trebling under RCW
  19.86.090 is capped (not re-verified today; see Open questions). First class action: Maxwell v. Amazon, February 2025
  (not re-opened today).
- **Find it:** the database schema and forms for health-shaped fields; analytics properties (TRACK-06); location
  permission prompts and whether coordinates are stored or sent; whether the home page links a consumer health data policy.
- **Fix:** a consent screen before the first health field; a separate opt-in before sharing with any vendor; a "Consumer
  Health Data Privacy Policy" page linked in the footer; strip health properties from analytics; coarsen or drop location.
  **Who:** Claude (screens, page draft, code), lawyer (policy review).
- **Status:** in force since March 31, 2024 (small businesses June 30, 2024).
- **Source:** https://app.leg.wa.gov/RCW/default.aspx?cite=19.373&full=true · "personal information that is linked or
  reasonably linkable to a consumer" · "A small business must comply with this section beginning June 30, 2024." · read 2026-11-16

### LAW-SENS-04 · Health apps leaking data count as a breach (FTC Health Breach Notification Rule, 16 CFR Part 318)
- **Applies when:** the app is a vendor of personal health records: it tracks conditions, medications, symptoms, fitness,
  fertility, sleep, mental health, diet or similar, and can draw data from more than one source (user entry plus a
  device, an API or another app). **Does not apply when:** the business is a HIPAA covered entity or business associate
  (SENS-05), or the app holds no health information.
- **What it requires:** notify users, the FTC and in some cases the media after a "breach of security", which includes
  an unauthorized disclosure by the company itself (a pixel sending health data counts). FTC notice for 500 or more
  people goes at the same time as user notice.
- **Exposure:** civil penalties per violation; the current maximum under 16 CFR 1.98 is $53,088 for penalties assessed
  after January 17, 2025.
- **Find it:** what the app tracks (schema, screens) and whether it imports from HealthKit, Google Fit, wearables or
  another API; then TRACK-06.
- **Fix:** stop the disclosure (TRACK-06); write a one-page breach response plan naming who notifies and within what
  time; if a leak already happened, the owner calls a lawyer. **Who:** Claude (plan draft, code), owner and lawyer
  (notice decisions).
- **Status:** in force (amended rule effective July 29, 2024, per the FTC; date not re-verified today).
- **Source:** https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-318 · "A breach of security includes an
  unauthorized acquisition of unsecured PHR identifiable health information ... that occurs as a result of a data breach or
  an unauthorized disclosure." · read 2026-11-16. Penalty: https://www.ecfr.gov/current/title-16/chapter-I/subchapter-A/part-1/subpart-L/section-1.98
  · "45(m)(1)(A) [dash] $53,088" and "apply only to penalties assessed after January 17, 2025" · read 2026-11-16

### LAW-SENS-05 · When HIPAA applies to an app and when it does not
- **Applies when:** the business is a covered entity (health plan, clearinghouse, or a provider who bills electronically)
  or a business associate building for one (a clinic's patient portal, a telehealth platform used by a practice).
  **Does not apply when:** a consumer app collects health data directly from users for its own service; that app is under
  the FTC Act, HBNR and state laws instead. Do not tell a consumer app it is "HIPAA compliant" or let it claim so.
- **What it requires:** for HIPAA entities, a business associate agreement with every vendor that touches protected
  health information, including hosting, email and AI APIs; tracking on logged-in pages only as the Privacy Rule allows.
- **Exposure:** HHS OCR enforcement; no private right of action under HIPAA itself.
- **Find it:** ask the owner who pays them and who their users are; search marketing copy for "HIPAA"; list vendors that
  receive patient data and whether each has a signed BAA.
- **Fix:** for a consumer app, remove "HIPAA compliant" claims unless true. For a HIPAA entity, owner signs BAAs (most AI
  and hosting vendors require an enterprise plan for one), no ad pixels on authenticated pages. **Who:** owner, lawyer.
- **Status:** in force. HHS's 2022 tracking guidance was partly vacated on June 20, 2024 (American Hospital Association
  v. Becerra, N.D. Tex.) for unauthenticated public pages; the part about logged-in pages was not vacated.
- **Source:** https://www.ftc.gov/business-guidance/resources/collecting-using-or-sharing-consumer-health-information-look-hipaa-ftc-act-health-breach
  · "The HIPAA Rules apply to you if you are a HIPAA covered entity" · read 2026-11-16. HHS tracking page
  (https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/hipaa-online-tracking/index.html) returned 403; vacatur
  details are from a search summary of that page: UNVERIFIED quote.

### LAW-SENS-06 · Precise location, sexual orientation, immigration status and other "sensitive data" (state privacy laws)
- **Applies when:** the business meets a state privacy law's threshold. Example, Virginia: controls or processes personal
  data of at least 100,000 consumers in a year, or 25,000 consumers and over 50 percent of revenue from selling data.
  Most state laws use similar numbers. **Does not apply when:** a small app is under the thresholds in every state where
  it has users (most early-stage apps are). Texas uses a different test (see Open questions). The FTC Act still applies
  to deceptive or unfair handling of sensitive data at any size.
- **What it requires:** opt-in consent before processing sensitive data: racial or ethnic origin, religion, health
  diagnosis, sexual orientation, citizenship or immigration status, biometric or genetic data for identification, data
  from a known child, and precise geolocation (Virginia: within 1,750 feet).
- **Exposure:** Attorney General enforcement in most states; civil penalties per violation set by each statute.
- **Find it:** location permission requests (`navigator.geolocation`, `expo-location`, `CLLocationManager`) and whether
  coordinates are stored at full precision or sent to analytics; profile fields for sexuality, gender identity,
  religion, nationality or immigration status; AI features that infer these from user content.
- **Fix:** ask only for what the feature needs; round or drop coordinates before storage; a separate opt-in for each
  sensitive field; no sharing of these fields with ad or analytics vendors. **Who:** Claude (code), owner (threshold facts).
- **Status:** in force (Virginia since 2023; other states on their own dates).
- **Source:** https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-575/ · "Personal data revealing racial
  or ethnic origin, religious beliefs, mental or physical health diagnosis, sexual orientation, or citizenship or
  immigration status" · read 2026-11-16. Thresholds: https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-576/
  · "during a calendar year, control or process personal data of at least 100,000 consumers" · read 2026-11-16

### LAW-SENS-07 · Money apps that may be a "financial institution" (GLBA, FTC Safeguards Rule, 16 CFR 314)
- **Applies when:** the app is "significantly engaged in financial activities": lending, loan brokering, account
  servicing, check cashing, money transmission, tax preparation, investment advice and the like. **Does not apply when:**
  the app only takes card payments for its own product through Stripe; a budgeting dashboard may or may not qualify
  (lawyer question).
- **What it requires:** a written information security program (qualified individual, risk assessment, MFA, encryption,
  vendor oversight). Some provisions are waived for institutions with customer information on fewer than 5,000 consumers.
- **Exposure:** FTC enforcement.
- **Find it:** ask what the app does with money; Plaid or bank-connection SDKs, loan or credit features in the code.
- **Fix:** flag to the owner; Claude can draft the security program outline from the app's real controls. **Who:**
  lawyer (whether covered), owner.
- **Status:** in force.
- **Source:** https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know · "maintain
  customer information concerning fewer than five thousand consumers" · read 2026-11-16

### LAW-SENS-08 · Background, employment or tenant screening (FCRA): lawyer flag
- **Applies when:** the app compiles or sells information about people for hiring, renting or credit decisions (scraped
  profiles, criminal records, "rate this tenant" or "vet this candidate" AI features). **Does not apply when:** the app
  does nothing of the kind.
- **What it requires:** a consumer reporting agency has accuracy, dispute and permissible-purpose duties; this is not a
  weekend fix.
- **Exposure:** FTC and CFPB enforcement and private suits under FCRA.
- **Find it:** features that score or summarize a named person for an employer or landlord.
- **Fix:** stop and send the owner to a lawyer before launch. **Who:** lawyer.
- **Status:** in force.
- **Source:** https://www.ftc.gov/business-guidance/resources/what-employment-background-screening-companies-need-know-about-fair-credit-reporting-act
  · "Companies that sell or provide those reports are \"consumer reporting agencies\" under the FCRA." · read 2026-11-16

---

## Not covered here
- Cookie banners under GDPR and ePrivacy, CCPA opt-out of sale and sharing, and privacy-policy contents: the privacy file.
- Data breaches from open databases and the CCPA breach private right of action (Civ. Code 1798.150): security files.
- Companion chatbots and minors (New York and California laws) and AI-therapy bans: the AI file.
- App Tracking Transparency on iOS: the app-store file.
- New Jersey's Daniel's Law: I found no primary source showing it reaches ordinary small apps rather than data brokers
  and people-search sites, so it is left out per the brief.
- Children's data and COPPA: kids-accessibility.md.

## Open questions
- SB 690's operative date: the chaptered bill states none. California non-urgency statutes normally take effect January
  1 of the year after enactment, which would be January 1, 2027; confirm on the bill history before telling an owner a
  pending 638.51 claim is gone.
- Illinois BIPA text could not be opened (TLS error on ilga.gov); quote the Public Act 103-0769 text before relying on SENS-01.
- Texas Data Privacy and Security Act: it has no numeric user threshold and an SBA small-business exemption, and I recall
  small businesses still need consent to sell sensitive data. The Texas statutes site did not render; not written as a rule.
- Washington CPA damages (RCW 19.86.090 trebling cap) and the $7,500 civil penalty were not re-opened today.
- BIPA settlement figures often quoted (Meta $650M, Google $100M, Clearview $51.75M) were not re-verified today.
- Salazar v. Paramount Global: decision expected in the October 2026 Term; rewrite TRACK-05 when it issues.
