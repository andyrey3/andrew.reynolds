# Morsel: pre-launch AI security checklist

Checked 2026-11-17 against the BreakingBreach Pre-launch AI Security Checklist (25 controls).
Morsel is a static, bring-your-own-key app: no backend, no tools, no shared data. Each person's key and data stay on their own device.

| Control | Status |
|---|---|
| 01 Protect API keys | ✅ No key in the repo or its history. The user's own key is AES-GCM encrypted in IndexedDB and left out of exports. |
| 02 Privileged ops on backend | ⚠️ Not applicable as written: there is no server. The browser calls Anthropic with the user's own key, so no shared key can be stolen. Add a backend proxy before ever shipping a shared/app-owned key. |
| 03 Message roles | ✅ Fixed system prompts; user text goes in the user role only. |
| 04 Delimit untrusted input | ✅ User text is wrapped in `<user_note>`; `<` is replaced so it cannot close the tag. |
| 05–06 Retrieved content / file parsing | ✅ No retrieval. Photos are re-encoded to JPEG on a canvas before sending. |
| 07–08 Injection screening / canary | ➖ Skipped: the system prompt holds no secrets and only the user's own data is in play. |
| 09–12 Identity & data access | ➖ Not applicable: single user, local data, no database. |
| 13–16 Tools & actions | ➖ Not applicable: no tools; the model only returns an estimate the user can edit. |
| 17 Structured output | ✅ JSON schema output; refusals and cut-offs are errors; numbers clamped, strings length-capped. |
| 18 Render output safely | ✅ All model text is HTML-escaped (`esc`) before rendering. |
| 19 Links / outbound requests | ✅ CSP `connect-src` allows only Anthropic and Open Food Facts; images only from self/data/blob. |
| 20 Input size | ✅ Text inputs capped at 1000 characters; photos downscaled before upload. |
| 21 Output limit | ✅ `max_tokens: 8000`; `max_tokens` stop is reported as incomplete. |
| 22 Timeouts | ✅ 90-second timeout per request; no automatic retries. |
| 23 Rate limits / budgets | ⚠️ Usage is billed to the user's own key. Set a spend limit at console.anthropic.com. |
| 24 Privacy-minded logging | ✅ Nothing is logged or sent anywhere except the API call itself. |
| 25 Tests | ✅ Delimiter escape and size cap checked; page loads with no errors. |
