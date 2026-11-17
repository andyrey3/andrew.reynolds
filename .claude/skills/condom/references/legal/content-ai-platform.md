# Legal: content, AI, terms and app stores (IP, UGC, AI, TERMS, STORE)

Scope: what the app contains (images, fonts, code, names), what its users post, what its AI says and where user data goes
when the AI runs, the app's own terms, and the rules of the stores it ships through. Privacy policies, cookies, pixels, email,
SMS, subscriptions, children's data and accessibility live in the other legal files; this file points to them where they
touch. Every source below was opened on 2026-11-16 unless the Source line says otherwise. This is a checklist for Claude, not
legal advice: entries marked **lawyer** need one.

## Contents
- LAW-IP-01 · Photos and icons you have no licence for (copyright, 17 U.S.C. 504)
- LAW-STORE-01 · No delete-account button (Apple 5.1.1(v), Google Play User Data policy)
- LAW-AI-01 · User data sent to an AI API without saying so (Apple 5.1.2(i); provider terms)
- LAW-UGC-01 · Users can post but nobody can report or block (Apple 1.2, Google Play AI-Generated Content)
- LAW-UGC-02 · No DMCA agent, so every infringing upload is yours (17 U.S.C. 512)
- LAW-AI-02 · The chatbot makes promises or gives professional advice (Moffatt v. Air Canada)
- LAW-TERMS-01 · No terms, or terms nobody agreed to (browsewrap vs clickwrap, Berman v. Freedom Financial)
- LAW-AI-03 · Chat or generated media not labelled as AI in the EU (EU AI Act, Art. 50)
- LAW-AI-04 · A companion-style chatbot with no crisis protocol (Cal. BPC 22601-22606; N.Y. GBL Art. 47)
- LAW-UGC-03 · Intimate images with no 48-hour takedown (TAKE IT DOWN Act, s. 3)
- LAW-IP-02 · A licence in the dependency tree you are not following (GPL, AGPL, Commons Clause)
- LAW-AI-05 · "AI-powered" claims you cannot back (FTC Act s. 5, Operation AI Comply)
- LAW-STORE-02 · Google login only on iOS (Apple 4.8)
- LAW-STORE-03 · Digital goods sold outside in-app purchase, or no Restore (Apple 3.1.1)
- LAW-STORE-04 · Privacy label, privacy manifest or Data safety form wrong (Apple 5.1.1(i), Google Play Data safety)
- LAW-UGC-04 · EU users can post and there is no notice-and-action path (Digital Services Act, Arts. 11-17)
- LAW-UGC-05 · UK users can post and there is no risk assessment (Online Safety Act 2023, s. 9)
- LAW-IP-03 · A name, logo or look copied from another product (trademark, trade dress; Apple 4.1, 5.2.1)
- LAW-IP-04 · Font files with no licence for app or web embedding (font licences, SIL OFL)
- LAW-IP-05 · Assuming you own AI-generated assets (U.S. Copyright Office, Part 2)
- LAW-AI-06 · A chatbot sold as therapy (Illinois WOPR Act, Public Act 104-0054)
- LAW-AI-07 · A sales bot that hides it is a bot (Cal. BPC 17941; Utah Code 13-75)
- LAW-AI-08 · Cloning a real voice or face (Tennessee ELVIS Act; right of publicity)
- LAW-UGC-06 · Child sexual abuse material found and not reported (18 U.S.C. 2258A)
- LAW-UGC-07 · Thinking Section 230 covers everything (47 U.S.C. 230(e))
- LAW-IP-06 · Scraping a site or using an API against its terms (contract; CFAA after Van Buren)
- LAW-TERMS-02 · No business name, address or contact on the site (EU e-Commerce Directive Art. 5; UK reg. 6; Cal. Civ. 1789.3; App Store trader status)
- LAW-STORE-05 · Android build below Google Play's target API level (Play target API requirement)

---

### LAW-IP-01 · Photos and icons you have no licence for (copyright, 17 U.S.C. 504)
- **Applies when:** any image, icon, illustration, video or audio file ships in the app or site that the owner did not make, generate or license. AI builders often drop in a "placeholder" stock photo or a hot-linked image. **Does not apply when:** every asset is the owner's own, from a licence that covers the use (Unsplash, Pexels, a paid stock licence), or public domain.
- **What it requires:** a licence for each copyrighted asset, kept with the asset. Rights-holder bots match images across the web and send demand letters (see https://picdefense.io/demand-letters/enforcement/pixsy/).
- **Exposure:** statutory damages per work, $750 to $30,000, up to $150,000 if willful; the copyright owner sues. In practice a demand letter usually comes first.
- **Find it:** list `public/`, `assets/`, `static/`, `src/assets/` and any CDN URLs in code (`grep -rE "https?://[^\"']+\.(jpe?g|png|webp|gif|svg|mp4|mp3)"`). For each file ask: where did it come from? Look for licence files, `CREDITS`, or comments. Red flags: filenames like `shutterstock_123.jpg`, `GettyImages-`, `istock`, watermark traces, images hot-linked from other sites, icon packs with no licence file (Font Awesome Pro, Flaticon "free with attribution" used without the attribution).
- **Fix:** an `ASSETS.md` (or `public/licenses/`) listing each file, its source URL and licence; add any attribution the licence asks for; replace or delete anything with no source. **Who:** Claude (inventory, replacement, attribution); owner (confirms where each asset came from; pays for licences).
- **Status:** in force.
- **Source:** https://www.law.cornell.edu/uscode/text/17/504 · "in a sum of not less than $750 or more than $30,000 as the court considers just" · read 2026-11-16

### LAW-STORE-01 · No delete-account button (Apple 5.1.1(v), Google Play User Data policy)
- **Applies when:** an iOS or Android app lets people create an account. **Does not apply when:** the app has no accounts, or is web-only (then see the privacy file for deletion rights under privacy law).
- **What it requires:** Apple: deletion must start inside the app. Google: an in-app path and a public web link where users can ask for deletion of the account and its data, declared in the Data safety form.
- **Exposure:** store rejection or removal. No fine.
- **Find it:** search for `deleteUser`, `delete account`, `auth.admin.deleteUser` (Supabase), `deleteUser(` (Firebase), a settings screen. Check the server side: does deletion cascade (foreign keys `on delete cascade`, storage objects, Stripe customer, email list)? For Play, look for a public URL like `/delete-account` that works without the app.
- **Fix:** Settings → Delete account with a confirm step; a server route that deletes the auth user and every row and file keyed to them (or anonymises what must be kept by law, and says so); a public web page for Play. **Who:** Claude (code); owner (fills the Play form, decides what is kept for tax or legal reasons).
- **Status:** in force.
- **Source:** https://developer.apple.com/app-store/review/guidelines/ · "If your app supports account creation, you must also offer account deletion within the app" · read 2026-11-16 (page last updated Oct 16, 2026). Google: https://support.google.com/googleplay/android-developer/answer/13327111 · "provide a web link resource where users can request app account deletion and associated data deletion" · read 2026-11-16

### LAW-AI-01 · User data sent to an AI API without saying so (Apple 5.1.2(i); provider terms)
- **Applies when:** the app sends anything a user typed, uploaded or said to OpenAI, Anthropic, Google or another model provider. **Does not apply when:** the AI only sees the owner's own content (marketing copy, docs) and no user data.
- **What it requires:** Apple: say clearly where personal data goes, including to a third-party AI, and get explicit permission first. Privacy law (see the privacy file) needs the provider named in the policy. Provider defaults, as each provider states them: OpenAI says API data is not used for training unless you opt in, and abuse-monitoring logs, which can hold prompts and responses, are kept up to 30 days by default. Anthropic says it does not use inputs or outputs from commercial products, the API included, for training by default. Each provider also has usage policies the app must stay inside; read the current page before relying on it.
- **Exposure:** App Store rejection. Under privacy law, see the privacy file. A breach of the provider's usage policy can get the API key cut off.
- **Find it:** grep for `openai`, `@anthropic-ai/sdk`, `generativelanguage`, `api.openai.com`, `api.anthropic.com`, `ai` SDK (`@ai-sdk/`). For each call, list what goes in the prompt: user messages, profile fields, uploaded files, emails, health or payment data. Then check: does the privacy policy name the provider? On iOS, is there a consent screen before the first call?
- **Fix:** a one-time consent screen before the first AI request that names the provider and what is sent; strip fields the model does not need (emails, IDs, payment data) before the call; add the provider to the privacy policy. If an enterprise zero-retention option matters, the owner asks the provider. **Who:** Claude (consent screen, data minimisation, policy text); owner (provider settings and agreements).
- **Status:** in force.
- **Source:** https://developer.apple.com/app-store/review/guidelines/ · "You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so." · read 2026-11-16. OpenAI: https://developers.openai.com/api/docs/guides/your-data · "data sent to the OpenAI API is not used to train or improve OpenAI models (unless you explicitly opt in to share data with us)" · read 2026-11-16. Anthropic: https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training · "By default, we will not use your inputs or outputs from our commercial products" · read 2026-11-16

### LAW-UGC-01 · Users can post but nobody can report or block (Apple 1.2, Google Play AI-Generated Content)
- **Applies when:** users can post, comment, message, upload, or generate content with AI that others (or they) see. **Does not apply when:** nothing a user makes is shown to anyone, and no AI generates content for them.
- **What it requires:** Apple 1.2: a filter for objectionable material, a way to report it with timely responses, a way to block abusive users, and published contact details. Apple's 1.2 now names "AI content creation apps". Google Play: apps that generate content with AI need an in-app report or flag feature.
- **Exposure:** store rejection or removal. It is also the practical base for LAW-UGC-02 to 05.
- **Find it:** list every table or collection that holds user-made content (`posts`, `comments`, `messages`, `reviews`, `uploads`, `generations`). For each, search the UI for a Report or Flag control, a block-user action, and an admin view of reports. Bad result: content tables with no `reports` table and no moderation screen.
- **Fix:** a Report button on every item that writes to a `reports` table (item id, reporter, reason, time); Block user; an admin queue the owner actually reads; a keyword or provider moderation filter on submit (the AI provider's moderation endpoint is one option); a contact email in the app. **Who:** Claude (code); owner (reads the queue).
- **Status:** in force.
- **Source:** https://developer.apple.com/app-store/review/guidelines/ · "A mechanism to report offensive content and timely responses to concerns" · read 2026-11-16. Google: https://support.google.com/googleplay/android-developer/answer/13985936 · "must contain in-app user reporting or flagging features that allow users to report or flag offensive content to developers without needing to exit the app" · read 2026-11-16

### LAW-UGC-02 · No DMCA agent, so every infringing upload is yours (17 U.S.C. 512)
- **Applies when:** users can upload or post material that could be someone else's copyright (images, audio, video, text). **Does not apply when:** users cannot post anything others see.
- **What it requires:** for the safe harbour: a designated agent registered with the Copyright Office and listed on the site; a working takedown process for notices; a repeat-infringer policy that is adopted, told to users, and enforced. The fee is $6; a designation expires three years after registration unless renewed.
- **Exposure:** without the safe harbour, the service can be liable for users' infringement, with statutory damages of $750 to $30,000 per work, up to $150,000 if willful (17 U.S.C. 504(c)). Copyright owners sue.
- **Find it:** look for a `/dmca` or `/copyright` page and an agent name, address, phone and email; a takedown route or inbox; a repeat-infringer clause in the terms. Search the directory at https://dmca.copyright.gov for the owner's company.
- **Fix:** owner registers the agent ($6) and diarises renewal; Claude adds a `/dmca` page with the agent's details and the notice elements from 512(c)(3), a takedown route that hides the item and notifies the uploader, a counter-notice path, and a repeat-infringer clause in the terms. **Who:** owner (registration), Claude (pages and code).
- **Status:** in force.
- **Source:** https://www.law.cornell.edu/uscode/text/17/512 · "apply to a service provider only if the service provider has designated an agent to receive notifications of claimed infringement" · read 2026-11-16. Fee and renewal: https://www.copyright.gov/dmca-directory/faq.html · "A service provider's designation will expire and become invalid three years after it is registered with the Office, unless the service provider renews" · read 2026-11-16 (same page: "The current fee is $6")

### LAW-AI-02 · The chatbot makes promises or gives professional advice (Moffatt v. Air Canada)
- **Applies when:** a support or sales bot answers customers about prices, refunds, policies, or gives legal, medical or financial guidance. **Does not apply when:** the bot only routes to humans or quotes fixed text.
- **What it requires:** nothing new; ordinary law treats what the bot says as what the business says. In Moffatt (a British Columbia small-claims tribunal, so persuasive, not binding in the U.S.) the airline was held to a refund policy its bot made up. Giving individual legal, medical or financial advice can also run into professional-licensing rules that vary by state: **lawyer** flag.
- **Exposure:** contract and negligent-misrepresentation claims from users; for advice, licensing regulators. In Moffatt the order was C$812.02 in total, of which C$650.88 was damages (often misreported as "C$812.02 in damages"; the rest was interest and fees).
- **Find it:** open every system prompt (`grep -rn "system" --include=*.ts` near AI calls; files named `prompt*`). Bad result: no rule against stating prices, refunds, guarantees or advice; policies generated by the model instead of pulled from a source of truth; no logging of conversations.
- **Fix:** the prompt forbids stating prices, refunds, guarantees or legal, medical or financial advice and tells the model to link the policy page; answer policy questions by retrieving the real page text; log conversations; a visible line under the chat ("answers can be wrong; check with support"). **Who:** Claude; **lawyer** if the product is advice.
- **Status:** decided 2024 (persuasive authority).
- **Source:** https://decisions.civilresolutionbc.ca/crt/crtd/en/item/525448/index.do · "It should be obvious to Air Canada that it is responsible for all the information on its website. It makes no difference whether the information comes from a static page or a chatbot." · read 2026-11-16

### LAW-TERMS-01 · No terms, or terms nobody agreed to (browsewrap vs clickwrap, Berman v. Freedom Financial)
- **Applies when:** any app with users or payments. Terms are where liability limits, arbitration, governing law, refunds, acceptable use, age limits and the right to remove content live. **Does not apply when:** never fully, but a static brochure site needs far less.
- **What it requires:** terms only bind if users saw them and agreed. A link in the footer ("browsewrap") often fails. In the Ninth Circuit the test is conspicuous notice plus an action that clearly means "I agree"; other circuits use similar tests (the Second Circuit's Meyer v. Uber, cited in Berman).
- **Exposure:** unenforceable terms mean no liability cap, no arbitration clause, no content-removal right to point to.
- **Find it:** is there a `/terms` page? At sign-up and checkout, is there a checkbox or a button that says "By creating an account you agree to the Terms" right next to it, in readable size, with the link visible? Is the agreement recorded (user id, terms version, timestamp)? Do the terms cover: refunds, acceptable use, minimum age, how terms change and how users are told, content licence from users, removal and appeal, governing law?
- **Fix:** a terms page drafted for what the app does; an unchecked "I agree to the Terms and Privacy Policy" checkbox (or adjacent "By clicking Create account you agree" text) at sign-up and checkout; store `terms_version` and `accepted_at`; email users before material changes and ask again on next login. Refund and auto-renewal rules: see the subscriptions file. **Who:** Claude (flow, storage, a first draft); **lawyer** (liability, arbitration, governing law).
- **Status:** in force (case law; courts differ by state and circuit).
- **Source:** https://cdn.ca9.uscourts.gov/datastore/opinions/2022/04/05/20-16900.pdf · "(1) the website provides reasonably conspicuous notice of the terms to which the consumer will be bound; and (2) the consumer takes some action, such as clicking a button or checking a box" · read 2026-11-16

### LAW-AI-03 · Chat or generated media not labelled as AI in the EU (EU AI Act, Art. 50)
- **Applies when:** the app is offered to people in the EU and has a chatbot, or generates images, audio, video or text. **Does not apply when:** no EU users, or it is obvious to a reasonable user that they are talking to an AI.
- **What it requires:** providers of chat systems tell people they are interacting with an AI. Providers of generators mark outputs in a machine-readable, detectable way (Art. 50(2)). Deployers of deepfakes disclose them (Art. 50(4)). Art. 50 applies from 2 August 2026. The Digital Omnibus did not delay it: the only grace is for systems already on the market before 2 August 2026, which have until 2 December 2026 for the 50(2) marking duty. Most small apps call a model API; the model provider usually marks images, but the app is still the provider of its own chat system. Prohibited practices (Art. 5, applying since 2 February 2025) include manipulative techniques and exploiting vulnerabilities; the Omnibus adds a ban on AI that makes non-consensual intimate images of real people, from December 2026 per the Council.
- **Exposure:** fines up to EUR 15,000,000 or 3% of worldwide turnover for transparency breaches; national market-surveillance authorities enforce. No private right of action in the Act.
- **Find it:** open the chat UI: is there a persistent "AI" label or first-message disclosure? For generators: does the output keep the provider's C2PA or watermark metadata, or does the app strip it (re-encoding with `sharp`, canvas export)?
- **Fix:** a visible "You're chatting with an AI" line in the chat header; keep or add C2PA metadata on generated files and do not strip it on resize; a visible "AI-generated" label on images of real people. **Who:** Claude.
- **Status:** in force from 2 August 2026; 50(2) for pre-existing systems from 2 December 2026.
- **Source:** https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R1689 · "informed that they are interacting with an AI system, unless this is obvious from the point of view of a natural person who is reasonably well-informed" · read 2026-11-16. Dates: https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act · "Providers of such systems must comply with those obligations only as from 2 December 2026." · read 2026-11-16. Omnibus: https://www.consilium.europa.eu/en/press/press-releases/2026/06/29/artificial-intelligence-council-gives-final-green-light-to-simplify-and-streamline-rules/ · "AI systems that generate nude images of real people ... are set to be banned as of December this year" · read 2026-11-16

### LAW-AI-04 · A companion-style chatbot with no crisis protocol (Cal. BPC 22601-22606; N.Y. GBL Art. 47)
- **Applies when:** the bot is built to meet social needs and keep a relationship across sessions (a friend, partner, mentor persona) and is available in California or New York. **Does not apply when:** the bot is only customer service, a business tool, productivity or research help, or a game bot limited to the game (California's exclusions).
- **What it requires:** California (from 1 January 2026): a clear notice that it is not human if a reasonable person could be misled; a published protocol that stops suicide and self-harm content and refers users to crisis services; for known minors, AI disclosure, a break reminder every three hours, and blocks on sexual content; a notice that it may not suit some minors; annual reports to the Office of Suicide Prevention from 1 July 2027. New York (from 5 November 2025): a not-human notice at the start of each interaction (no more than daily) and every three hours, plus a crisis protocol.
- **Exposure:** California: anyone injured can sue for the greater of actual damages or $1,000 per violation, plus fees. New York: attorney general, civil penalties up to $15,000 per day.
- **Find it:** read the persona prompt and marketing: "friend", "companion", "girlfriend", memory across sessions. Then search for crisis handling (keywords, a moderation call, a hotline message) and a not-human notice.
- **Fix:** a not-human banner on open and every three hours of continuous chat; self-harm detection (provider moderation or a classifier) that returns crisis resources (988 in the U.S.) and stops the persona reply; a public page describing the protocol; an age question and the minor rules if minors can use it. **Who:** Claude (code, protocol page); owner (decides on age policy; files California reports from 2027).
- **Status:** in force (CA since 2026-01-01; NY since 2025-11-05).
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=BPC&division=8.&title=&part=&chapter=22.6.&article= · "Damages in an amount equal to the greater of actual damages or one thousand dollars ($1,000) per violation." · read 2026-11-16. NY: https://www.nysenate.gov/legislation/laws/GBS/1702 · "at least every three hours for continuing AI companion interactions which states either verbally or in writing that the user is not communicating with a human" · read 2026-11-16; penalty https://www.nysenate.gov/legislation/laws/GBS/1703 · "civil penalties of up to fifteen thousand dollars per day" · read 2026-11-16

### LAW-UGC-03 · Intimate images with no 48-hour takedown (TAKE IT DOWN Act, s. 3)
- **Applies when:** a "covered platform": a public website or app that primarily hosts user-generated content (messages, images, video, audio, games), or whose business is hosting such images. That includes AI image generators whose outputs users share. **Does not apply when:** email, broadband providers, or a site of mostly the owner's own content where comments are incidental.
- **What it requires:** a clear, conspicuous way to request removal of non-consensual intimate images, real or AI-made; removal of the image and known identical copies within 48 hours of a valid request.
- **Exposure:** FTC enforcement, civil penalties up to $53,088 per violation; the FTC runs TakeItDown.ftc.gov for public reports.
- **Find it:** user image or video upload, or an image generator; then look for a removal-request form (not just a support email), a ticket with a 48-hour clock, and duplicate detection (a file hash check on upload).
- **Fix:** a `/report-image` form (link to the content, the requester's statement that it is non-consensual, a signature, a contact); a ticket with a 48-hour due time and an alert; hash removed files and block re-uploads; a link to the form in the footer and on each image. **Who:** Claude (code); owner (staffs it).
- **Status:** in force; FTC enforcement from 2026-05-19.
- **Source:** https://www.ftc.gov/business-guidance/blog/2026/05/take-it-down-act-enforcement-starts-now-what-know-about-ftc-tida · "they are required by law to take down the images and remove duplicates within 48 hours of a valid request" · read 2026-11-16. Definition: https://www.govinfo.gov/content/pkg/PLAW-119publ12/html/PLAW-119publ12.htm · "primarily provides a forum for user-generated content, including messages, videos, images, games, and audio files" · read 2026-11-16

### LAW-IP-02 · A licence in the dependency tree you are not following (GPL, AGPL, Commons Clause)
- **Applies when:** the app uses open-source packages (all of them do). Most npm packages are MIT, ISC, BSD or Apache-2.0, which only need the licence notice kept. **Does not apply when:** the tree is all permissive licences and notices are kept.
- **What it requires:** GPL: if you distribute the program (a mobile app or desktop build counts; a hosted web app is usually not distribution), you must offer its source under the GPL. AGPL: a modified AGPL program used over a network must offer its source to those users, so it reaches hosted apps. "Source-available" licences (Commons Clause, BSL, SSPL, Elastic) can forbid selling a service built on the software.
- **Exposure:** copyright infringement for using code outside its licence; the code's owner sues or demands compliance.
- **Find it:** run `npx license-checker --summary` (or `--production --csv`) in each package folder; for Python, `pip-licenses`. Flag: `GPL`, `AGPL`, `LGPL` in a mobile bundle, `SSPL`, `BUSL`, `Commons Clause`, `Elastic`, `UNLICENSED`, `UNKNOWN`. Also read `LICENSE` files of anything vendored or copied into `src/`. Check whether the app is shipped as a binary (mobile, Electron) or only hosted.
- **Fix:** replace the flagged package with a permissive one, or comply (publish source, keep notices); add a `THIRD_PARTY_NOTICES` file to builds. **Who:** Claude (inventory, swaps); **lawyer** if a GPL/AGPL or source-available package is core to a paid product.
- **Status:** in force (licence terms; enforcement varies).
- **Source:** https://www.gnu.org/licenses/agpl-3.0.en.html · "your modified version must prominently offer all users interacting with it remotely through a computer network ... an opportunity to receive the Corresponding Source" · read 2026-11-16. https://commonsclause.com/ · "the License does not grant to you, the right to Sell the Software" · read 2026-11-16

### LAW-AI-05 · "AI-powered" claims you cannot back (FTC Act s. 5, Operation AI Comply)
- **Applies when:** marketing says the AI detects, diagnoses, guarantees, replaces a professional, or gives an accuracy number. **Does not apply when:** claims are modest ("helps you draft") and true.
- **What it requires:** the same rule as any ad: claims must be true and backed by evidence when made. The FTC's 2024 sweep (DoNotPay, Rytr and three income schemes) said there is no AI exemption. Also: accessiBe ($1,000,000, 2025).
- **Exposure:** FTC orders and money; civil penalties where a rule or order is broken. State attorneys general enforce similar laws.
- **Find it:** grep landing pages and store listings for `AI-powered`, `detect`, `diagnose`, `guarantee`, `%`, `accurate`, `lawyer`, `doctor`, `therapist`. For each claim, is there a test result in the repo or the owner's hands?
- **Fix:** rewrite to what has been measured ("assists", "suggests"); remove accuracy numbers without a reproducible test; keep the test data. **Who:** Claude (copy); owner (confirms evidence).
- **Status:** in force.
- **Source:** https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes · "Using AI tools to trick, mislead, or defraud people is illegal" · read 2026-11-16

### LAW-STORE-02 · Google login only on iOS (Apple 4.8)
- **Applies when:** an iOS app's main account can be created with Google, Facebook, X or another third-party login. **Does not apply when:** the app uses only its own email/password account, or is web-only.
- **What it requires:** an equivalent option that limits data to name and email, lets users hide their email, and does not track for ads without consent. Sign in with Apple meets it.
- **Exposure:** rejection.
- **Find it:** `signInWithOAuth({ provider: 'google' })`, `GoogleSignin`, `expo-auth-session` with no `apple` provider.
- **Fix:** add Sign in with Apple (Supabase and Firebase both support it). **Who:** Claude (code); owner (Apple developer account keys).
- **Status:** in force.
- **Source:** https://developer.apple.com/app-store/review/guidelines/ · "must also offer as an equivalent option another login service with the following features" · read 2026-11-16

### LAW-STORE-03 · Digital goods sold outside in-app purchase, or no Restore (Apple 3.1.1)
- **Applies when:** an iOS app unlocks features, subscriptions or credits. **Does not apply when:** it sells physical goods or services used outside the app (Apple 3.1.3(e)); reader-app and regional link-out rules are narrower and change often, so check the current guideline before relying on them.
- **What it requires:** unlocking digital features uses in-app purchase; a restore mechanism for restorable purchases.
- **Exposure:** rejection.
- **Find it:** Stripe Checkout or payment links reachable inside the iOS build; a paywall with no `restorePurchases` call (StoreKit, RevenueCat `restorePurchases()`).
- **Fix:** route iOS purchases through StoreKit or RevenueCat; a Restore button that re-fetches transactions and re-grants entitlements; test after reinstall on a real device. **Who:** Claude; owner (App Store Connect products).
- **Status:** in force.
- **Source:** https://developer.apple.com/app-store/review/guidelines/ · "If you want to unlock features or functionality within your app ... you must use in-app purchase." · read 2026-11-16

### LAW-STORE-04 · Privacy label, privacy manifest or Data safety form wrong (Apple 5.1.1(i), Google Play Data safety)
- **Applies when:** any store app, including data collected by SDKs (analytics, crash reporting, ads) that never touches the owner's server. **Does not apply when:** web-only.
- **What it requires:** Apple: a privacy policy link in App Store Connect and in the app; accurate App Privacy answers; a `PrivacyInfo.xcprivacy` manifest recording data types and required-reason APIs, and signed manifests for listed common SDKs (required since spring 2024). Google: every app on any testing or production track completes the Data safety form, SDK data included.
- **Exposure:** rejection or removal.
- **Find it:** list SDKs in `package.json`, `Podfile.lock`, `build.gradle`; check `ios/*/PrivacyInfo.xcprivacy` exists; compare each SDK's documented data collection with the owner's label answers.
- **Fix:** an SDK inventory table; fill both forms from it; add or update the manifest. **Who:** Claude (inventory, manifest); owner (submits the forms).
- **Status:** in force.
- **Source:** https://developer.apple.com/news/?id=r1henawx · "Starting in spring 2024, if your new app or app update submission adds a third-party SDK that is commonly used in apps on the App Store, you'll need to include the privacy manifest" · read 2026-11-16. Google: https://support.google.com/googleplay/android-developer/answer/10787469 · "All developers that have an app published on Google Play must complete the Data safety form" · read 2026-11-16

### LAW-UGC-04 · EU users can post and there is no notice-and-action path (Digital Services Act, Arts. 11-17)
- **Applies when:** the app hosts information users provide (posts, files, profiles) and is offered to people in the EU, even from outside the EU. **Does not apply when:** no hosted user content, or no EU offering. Micro and small enterprises (under 50 staff and under EUR 10m turnover or balance sheet, per Recommendation 2003/361/EC) are exempt from the extra online-platform duties in Section 3 (complaint system, dispute bodies, trusted flaggers, ad and dark-pattern rules), but **not** from the hosting duties below.
- **What it requires:** a public point of contact for users and for authorities (Arts. 11-12); a legal representative in an EU member state if there is no EU establishment (Art. 13); content rules and moderation explained in the terms (Art. 14); an easy electronic way for anyone to report illegal content (Art. 16); a statement of reasons to users whose content is removed or restricted (Art. 17). Article 16 reaches small services.
- **Exposure:** national penalties up to 6% of annual worldwide turnover; enforced by the member state's Digital Services Coordinator.
- **Find it:** same as LAW-UGC-01, plus: a `/legal` or contact page with an email; moderation rules in the terms; a removal notification sent to the poster with the reason.
- **Fix:** LAW-UGC-01's report flow open to logged-out visitors; a "why this was removed" email or in-app notice; a paragraph in the terms on what is removed and how to appeal; a contact email. **Who:** Claude; owner (appoints an EU representative if needed; **lawyer** for that).
- **Status:** in force for all providers since 17 February 2024.
- **Source:** https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065 · "Providers of hosting services shall put mechanisms in place to allow any individual or entity to notify them of the presence on their service of specific items of information that the individual or entity considers to be illegal content." · read 2026-11-16. Exemption (Art. 19): same page · "This Section, with the exception of Article 24(3) thereof, shall not apply to providers of online platforms that qualify as micro or small enterprises" · read 2026-11-16

### LAW-UGC-05 · UK users can post and there is no risk assessment (Online Safety Act 2023, s. 9)
- **Applies when:** a user-to-user service (users can share content other users see) with links to the UK: a significant number of UK users, the UK as a target market, or a material risk of significant harm to UK users. Size does not exempt it. **Does not apply when:** users can only comment on or review the provider's own content, share those comments, or like them (Schedule 1, "limited functionality"); or email, SMS and one-to-one voice only.
- **What it requires:** a written, suitable and sufficient illegal content risk assessment, kept up to date, and redone before significant design changes; proportionate safety measures, reporting and complaints (Ofcom's codes).
- **Exposure:** up to £18 million or 10% of qualifying worldwide revenue, whichever is greater; Ofcom enforces. Ofcom's first fine: 4chan, October 2025, as reported by The Register.
- **Find it:** ask the owner whether UK users can post or message each other. Look for a risk-assessment document in the repo or the owner's files.
- **Fix:** owner writes the assessment using Ofcom's guidance for services (Ofcom's own pages blocked automated fetching today); Claude can draft it from the app's real features and make sure LAW-UGC-01's report button exists so the assessment is true. **Who:** owner, with Claude drafting.
- **Status:** illegal-content duties in force since 17 March 2025 (Ofcom page not opened today).
- **Source:** https://www.legislation.gov.uk/ukpga/2023/50/section/9 · "A duty to carry out a suitable and sufficient illegal content risk assessment" · read 2026-11-16. Reach: https://www.legislation.gov.uk/ukpga/2023/50/section/4 · "the service has a significant number of United Kingdom users, or (b) United Kingdom users form one of the target markets" · read 2026-11-16. Fine: https://www.legislation.gov.uk/ukpga/2023/50/schedule/13/paragraph/4 · "(a) £18 million, and (b) 10% of the person's qualifying worldwide revenue" · read 2026-11-16

### LAW-IP-03 · A name, logo or look copied from another product (trademark, trade dress; Apple 4.1, 5.2.1)
- **Applies when:** the app's name, logo, icon, colours or UI imitate a known product, or the listing uses other brands ("ChatGPT", "Notion") in the name or keywords. **Does not apply when:** brand names are only used to describe a real integration ("works with Stripe"), honestly.
- **What it requires:** do not use another's mark in a way likely to confuse buyers; do not copy a distinctive look (trade dress). Cloning a paid app's code or assets is copyright infringement on top. Apple rejects copycats and protected third-party material without permission. An App Store Connect name reservation gives no trademark rights.
- **Exposure:** cease-and-desist, store takedown, and federal or state trademark suits (Lanham Act remedies not checked here).
- **Find it:** read the app name, bundle id, icon, store title and keywords; search https://tmsearch.uspto.gov/ for the name in the software classes (009, 042); compare the landing page side by side with the product it resembles.
- **Fix:** rename before launch if a close live mark exists in the same class; remove other brands from the name and icon; restyle copied UI. **Who:** owner decides; **lawyer** for a clearance search or filing.
- **Status:** in force.
- **Source:** https://developer.apple.com/app-store/review/guidelines/ · "Don't use protected third-party material such as trademarks, copyrighted works, or patented ideas in your app without permission" · read 2026-11-16. USPTO search: https://www.uspto.gov/trademarks/search (links to https://tmsearch.uspto.gov/) · read 2026-11-16

### LAW-IP-04 · Font files with no licence for app or web embedding (font licences, SIL OFL)
- **Applies when:** `.ttf`, `.otf`, `.woff`, `.woff2` files are in the repo or bundle. **Does not apply when:** fonts load from Google Fonts or are under the SIL Open Font License, which allows embedding and bundling.
- **What it requires:** desktop licences for commercial fonts often exclude web or app embedding; those need a separate web or app licence from the foundry.
- **Exposure:** copyright claims from the foundry, usually a demand for a licence fee.
- **Find it:** `find . -name "*.woff*" -o -name "*.ttf" -o -name "*.otf"` outside `node_modules`; check for an `OFL.txt` or licence beside each; check `next/font/local` sources. Unknown commercial names (e.g. foundry fonts copied from a design file) are the flag.
- **Fix:** swap to an OFL font or buy the web/app licence and store it in the repo. **Who:** Claude (swap); owner (purchase).
- **Status:** in force.
- **Source:** https://openfontlicense.org/open-font-license-official-text/ · "can be bundled, embedded, redistributed and/or sold with any software provided that any reserved names are not used by derivative works" · read 2026-11-16

### LAW-IP-05 · Assuming you own AI-generated assets (U.S. Copyright Office, Part 2)
- **Applies when:** logos, illustrations, copy or code were generated by AI and the owner plans to register or enforce them. **Does not apply when:** no one needs to stop others copying the asset.
- **What it requires:** in the U.S., AI output is protected only where a human contributed enough expression; prompts alone are not enough. The asset can still be used; it may just be hard to stop others using it. Training or fine-tuning on data the owner has no rights to is unsettled law (the Office's Part 3 was a pre-publication release in May 2025, and court rulings differ): **lawyer** flag.
- **Exposure:** no penalty; weak or no rights in a key brand asset.
- **Find it:** ask which brand assets were generated. Check the AI tool's terms for output ownership.
- **Fix:** have a human redraw or substantially modify the logo; register the trademark (which does not need copyright). **Who:** owner.
- **Status:** Copyright Office guidance, January 2025.
- **Source:** https://www.copyright.gov/newsnet/2025/1060.html · "the outputs of generative AI can be protected by copyright only where a human author has determined sufficient expressive elements" · read 2026-11-16

### LAW-AI-06 · A chatbot sold as therapy (Illinois WOPR Act, Public Act 104-0054)
- **Applies when:** the app offers or advertises therapy or psychotherapy through AI to people in Illinois. **Does not apply when:** it is a wellness, journaling or self-help tool that does not claim to offer therapy (the Act excludes resources that do not purport to offer therapy), or a licensed professional conducts the therapy.
- **What it requires:** therapy offered to the public must be conducted by a licensed professional.
- **Exposure:** civil penalty up to $10,000 per violation, imposed by the Illinois Department of Financial and Professional Regulation.
- **Find it:** grep the system prompt and marketing for `therapy`, `therapist`, `counsel`, `treatment`, `psychotherap`.
- **Fix:** remove therapy language from prompts, marketing and store listing; keep the self-harm protocol from LAW-AI-04; or put a licensed clinician in the loop. **Who:** Claude (copy); **lawyer** if the product is meant to be clinical.
- **Status:** in force since 2025-08-01.
- **Source:** https://www.ilga.gov/legislation/publicacts/fulltext.asp?Name=104-0054 · "may not provide, advertise, or otherwise offer therapy or psychotherapy services, including through the use of Internet-based artificial intelligence, to the public in this State" · read 2026-11-16

### LAW-AI-07 · A sales bot that hides it is a bot (Cal. BPC 17941; Utah Code 13-75)
- **Applies when:** California: a bot talks to people in California with intent to mislead them about being a bot, to push a sale or influence a vote. Utah: a business uses generative AI to talk to consumers in a consumer transaction. **Does not apply when:** the bot discloses it is a bot (California's safe harbour); in Utah, the duty is triggered when the user asks, except for regulated occupations and high-risk interactions where disclosure is proactive (2025 amendments; enrolled text not opened, see Open questions).
- **What it requires:** a clear, conspicuous disclosure that it is a bot; in Utah, an honest answer when asked.
- **Exposure:** California: 17941 states no penalty itself, and the enforcement section (17942-17943) was not read; treat it as unverified. Utah: Division of Consumer Protection (from the bill; not checked against the enrolled code).
- **Find it:** persona prompts with human names and no disclosure; prompts telling the model to deny being AI.
- **Fix:** "AI assistant" label in the chat; a prompt rule to always answer "yes, I'm an AI" when asked. **Who:** Claude.
- **Status:** California in force since 2019-07-01; Utah in force (2024 act, amended 2025). Colorado's AI Act (SB 24-205) never took effect: SB 26-189, signed 2026-05-14, repealed and re-enacted it as an automated-decision law starting 2027-01-01, aimed at consequential decisions (jobs, loans, housing and similar), not chat disclosure. Older notes giving June 30, 2026 are out of date.
- **Source:** https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=17941. · "A person using a bot shall not be liable under this section if the person discloses that it is a bot." · read 2026-11-16. Utah: https://le.utah.gov/Session/2025/bills/introduced/SB0226S01.pdf (1st substitute, not the enrolled text) · "shall clearly and conspicuously disclose to the individual that the individual is interacting with generative artificial intelligence and not a human if the individual asks" · read 2026-11-16 via search excerpt. Colorado: https://leg.colorado.gov/bills/SB26-189 · "The act repeals and reenacts those provisions with new requirements regarding the use of automated decision-making technology in consequential decisions." · read 2026-11-16

### LAW-AI-08 · Cloning a real voice or face (Tennessee ELVIS Act; right of publicity)
- **Applies when:** the app clones voices, swaps faces, or makes avatars of real people, or the owner uses a real person's voice or likeness in ads. **Does not apply when:** users only clone themselves with consent, and the app stops them cloning others.
- **What it requires:** permission to use a person's name, voice or likeness commercially (state right-of-publicity laws, which differ by state). Tennessee makes a tool whose primary purpose is producing a specific person's voice or likeness a basis for liability when distributed knowing the use is unauthorised. Biometric capture (face or voice templates) also triggers Illinois BIPA: see the privacy file. EU deepfake labelling: LAW-AI-03.
- **Exposure:** civil suits by the person; Tennessee's act includes injunctions and damages.
- **Find it:** voice-clone or face-swap APIs (ElevenLabs voice cloning, image-to-image with a face reference); no consent step that the uploaded voice or face is the user's own.
- **Fix:** a consent step that the voice or face belongs to the user (or they have written permission); block celebrity names in prompts; label outputs; keep consent records. **Who:** Claude (flow); **lawyer** for anything using public figures.
- **Status:** ELVIS Act in force since 2024-07-01.
- **Source:** https://publications.tnsosfiles.com/acts/113/pub/pc0588.pdf · "the primary purpose or function of such algorithm, software, tool, or other technology, service, or device is the production of a particular, identifiable individual's photograph, voice, or likeness" · read 2026-11-16

### LAW-UGC-06 · Child sexual abuse material found and not reported (18 U.S.C. 2258A)
- **Applies when:** a U.S. electronic communication or remote computing service provider (any app hosting user uploads or messages) obtains actual knowledge of apparent CSAM. **Does not apply when:** never as a choice; but there is no duty to scan. The duty starts at actual knowledge.
- **What it requires:** report to NCMEC's CyberTipline as soon as reasonably possible, preserve the material as the statute directs, and do not keep or share it otherwise.
- **Exposure:** criminal fines for knowing and willful failure to report: up to $600,000 for a first failure by a provider with under 100 million monthly users, $850,000 after that.
- **Find it:** ask: is there a written step for what a moderator does if they see it? Does the admin report queue let a moderator escalate without downloading?
- **Fix:** a one-page runbook (do not download or forward; preserve; report at report.cybertip.org; remove from public view); an "escalate to CSAM report" action in the admin queue; optional hash matching through an industry service. **Who:** owner; Claude writes the runbook and queue action; **lawyer** on preservation details.
- **Status:** in force.
- **Source:** https://www.law.cornell.edu/uscode/text/18/2258A · "shall, as soon as reasonably possible after obtaining actual knowledge of any facts or circumstances described in paragraph (2)(A), take the actions described in subparagraph (B)" · read 2026-11-16

### LAW-UGC-07 · Thinking Section 230 covers everything (47 U.S.C. 230(e))
- **Applies when:** the owner relies on "we're just a platform". **Does not apply when:** n/a; this is a limits check.
- **What it requires:** Section 230 generally shields a service from being treated as the publisher of what users post (defamation in user reviews, for example). It does not cover federal criminal law, intellectual property (so DMCA, LAW-UGC-02, still matters), certain sex-trafficking claims, or the service's own content: testimonials the owner writes, AI output the app generates (courts have not settled whether 230 covers generative AI output), and fake reviews the business creates or suppresses (FTC rule, 16 CFR 465; see the consumer file).
- **Exposure:** whatever the underlying claim carries.
- **Find it:** content the business authors or edits (seeded reviews, "featured" testimonials, AI-written posts shown as user posts); review filtering that hides negative ones.
- **Fix:** label staff or seeded content; never edit users' meaning; do not filter out negative reviews; keep AI output labelled. **Who:** Claude; **lawyer** for a defamation complaint.
- **Status:** in force.
- **Source:** https://www.law.cornell.edu/uscode/text/47/230 · "Nothing in this section shall be construed to limit or expand any law pertaining to intellectual property." · read 2026-11-16. Fake reviews: https://www.ecfr.gov/current/title-16/part-465 · "for a business to write, create, or sell a consumer review ... that materially misrepresents ... That the reviewer or testimonialist exists" · read 2026-11-16

### LAW-IP-06 · Scraping a site or using an API against its terms (contract; CFAA after Van Buren)
- **Applies when:** the app scrapes other sites, reuses another platform's data, or calls an API for a use its terms forbid (resale, training, storing beyond limits). **Does not apply when:** the data is the owner's own or licensed.
- **What it requires:** follow the terms the owner accepted (API terms, developer agreements). The federal anti-hacking law is narrower after Van Buren (2021): "exceeds authorized access" means entering off-limits areas, not misusing data one may access; public-page scraping cases (hiQ v. LinkedIn) went further but were not opened today. Breach of contract and copyright in the scraped content remain.
- **Exposure:** API key termination, contract claims, copyright claims; CFAA risk where logins or technical blocks are bypassed.
- **Find it:** `puppeteer`, `playwright`, `cheerio`, `axios` against third-party domains; stored third-party data; API calls whose results are resold or used for training. Read the provider's API terms for each.
- **Fix:** use the official API within its terms; respect robots.txt and rate limits; never bypass logins or blocks; drop stored data the terms do not allow. **Who:** owner decides; **lawyer** if scraping is the business.
- **Status:** in force (case law unsettled for public data).
- **Source:** https://www.law.cornell.edu/supremecourt/text/19-783 · "An individual \"exceeds authorized access\" when he accesses a computer with authorization but then obtains information located in particular areas of the computer" · read 2026-11-16

### LAW-TERMS-02 · No business name, address or contact on the site (EU e-Commerce Directive Art. 5; UK reg. 6; Cal. Civ. 1789.3; App Store trader status)
- **Applies when:** EU or UK: an online service offered for pay or commercially to people there. California: a provider of an "electronic commercial service" contracting with California consumers (scope is narrow and rarely litigated; see Open questions). App Store: anyone distributing in the EU must declare trader status, and traders' details are published.
- **What it requires:** EU and UK: name, geographic address, email and any trade-register number, easily and permanently accessible (an imprint or legal page). California: name, address and phone, charges, and how to complain, including the Department of Consumer Affairs complaint unit. Apple: an address, phone and email it publishes on the EU product page.
- **Exposure:** EU/UK: national enforcement and competitor claims (Germany is active). Apple: apps not distributed in the EU.
- **Find it:** a `/legal`, `/imprint` or `/contact` page; footer contact; whether the owner's home address would be what gets published.
- **Fix:** a legal page with the business name, a registered-agent or business address, email and register number; owner forms an entity or uses an agent address before declaring trader status. **Who:** Claude (page); owner (entity, address).
- **Status:** in force.
- **Source:** https://www.legislation.gov.uk/uksi/2002/2013/regulation/6 · "(a) the name of the service provider; (b) the geographic address at which the service provider is established" · read 2026-11-16 (EU Art. 5 text, https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32000L0031, matches). California: leginfo blocked automated fetch; text read via FindLaw, https://codes.findlaw.com/ca/civil-code/civ-sect-1789-3/ · "(a) The name, address, and telephone number of the provider of service." · read 2026-11-16. Apple: https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements · "Apple will publish this information on your App Store product page when your app is distributed in any of the 27 territories of the EU" · read 2026-11-16

### LAW-STORE-05 · Android build below Google Play's target API level (Play target API requirement)
- **Applies when:** submitting a new Android app or update to Google Play. **Does not apply when:** iOS or web only.
- **What it requires:** from 31 August 2026, new apps and updates target Android 16 (API level 36); existing apps must target API 35 to stay visible to new users on newer devices. Extensions to 1 November 2026 could be requested; that date has passed.
- **Exposure:** upload blocked; reduced visibility.
- **Find it:** `targetSdkVersion` / `targetSdk` in `android/app/build.gradle`, or Expo `app.json` / `expo-build-properties`.
- **Fix:** raise `targetSdk` to 36 and test behaviour changes. **Who:** Claude; owner (testing on devices).
- **Status:** in force.
- **Source:** https://support.google.com/googleplay/android-developer/answer/11926878 · "New apps and app updates must target Android 16 (API level 36) or higher to be submitted to Google Play" · read 2026-11-16

---

## Not covered here
- Privacy policies, cookie banners, pixels, health data, biometrics (BIPA), children and age gates (COPPA, Texas App Store Accountability Act), email, SMS, subscriptions and cancellation, accessibility, urgency timers, algorithmic pricing: other legal files.
- EU Cyber Resilience Act reporting: belongs with security operations.
- Other App Store rejections that are not legal in nature (IPv6, lorem ipsum, demo login, beta wording, splash-screen screenshots, review prompts, metadata stuffing, OTA code, phased release): they belong in a store-readiness checklist. Apple's guideline text was checked for 5.1.1(i) and (v), 5.1.2(i), 1.2, 3.1.1, 4.1, 4.7, 4.8, 5.2.1 and 2.3.6.
- Google Play's 12-tester, 14-day closed-test rule for new personal accounts: not re-checked today.
- Patents; export controls; gambling and regulated goods; sector rules (finance, health, legal services) beyond a lawyer flag.

## Open questions
- Utah: I read the 2025 first-substitute bill excerpt, not the enrolled code section (le.utah.gov's code URL returned 404). The proactive-disclosure triggers for regulated occupations and the chapter's sunset date need the current Utah Code 13-75.
- California Civ. Code 1789.3: the definition of "electronic commercial service" (1789.2) was not read; whether a typical SaaS app is covered is unclear. leginfo blocked fetching, so the text came from FindLaw.
- Ofcom's own pages (small-service guidance, risk-assessment tool, the 4chan fine) blocked automated fetching; the statute was read instead. The 17 March 2025 start date for illegal-content duties was not confirmed from Ofcom's pages.
- EU AI Act Digital Omnibus: the Council said publication in the Official Journal would follow "shortly" (29 June 2026); I did not open the OJ entry. The Commission's FAQ states the 2 December 2026 date as settled.
- Whether Section 230 protects generative-AI output is unsettled; no appellate ruling was checked.
- hiQ v. LinkedIn (9th Cir. 2022) and the training-data copyright rulings of 2025 were not opened.
- Penalties for Moffatt-style chatbot misstatements in U.S. courts: no U.S. appellate decision was found or checked.
