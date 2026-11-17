# What has been checked, and how

Last checked: 2026-11-16. Every entry in `references/` is meant to carry a link to a primary source, a short quote from it and the
date it was read. This file says which quotes have been confirmed on their pages and which have not.

## Method
1. `tools/check_quotes.py` makes one plain request to each cited page, strips it to text and looks for the quote (ignoring quote
   marks, inline-code marks and spacing around punctuation; an ellipsis splits a quote into pieces that must all be present, in
   order). PDFs are read the same way if PyMuPDF is installed.
2. A site that refuses a plain request is not worked around by the script. Its quotes were opened by hand in a browser.
3. Presence is not meaning. A quote being on the page does not prove the entry reads it correctly.

Run it yourself: `python tools/check_quotes.py references/legal/privacy.md` (or any of the ten files).

## Security files (five files, 106 entries)
Every quote is on the page it cites, by script or by hand.

## Legal files (five files, 115 entries, plus four pointers in `privacy.md`)
- Found by script on their pages, or by hand on sites that refuse a script (ftc.gov, California's leginfo, nysenate.gov, W3C, the
  Texas statutes, Twilio, the BC Civil Resolution Tribunal): all but the five below.
- **Not confirmed**, because the page sits behind a browser challenge or the quote is not where it is cited:
  1. `LAW-AI-03`: the EU Council press release of 29 June 2026.
  2. `LAW-MKT-02`: the Eleventh Circuit opinion vacating the FCC's one-to-one consent rule (cited on Justia).
  3. `LAW-TRACK-07`: the Massachusetts SJC's Vita opinion (cited on Justia).
  4. `LAW-AI-07`: the Utah quote is not in the cited bill PDF.
  5. `LAW-TRACK-07`: the Arizona Smith v. Target opinion (link not opened).
- **26 entries carry an `UNVERIFIED` mark** in the text, each naming what was tried. Treat those lines as leads, not as checked law.
  One of them, `LAW-SENS-01` (Illinois BIPA), has a readable official copy at
  `https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004&ChapterID=57` and is due a rewrite from it.

## The first test
Two AI-built restaurant sites (one built by Claude Sonnet, one by Claude Opus, from the same prompt with no security words) were
audited by hand first: 12 holes, 10 of them proved on the live sites. The skill was then run on each codebase once, in security
mode, code only, and a plain run with no skill was given the same request.

| | With the skill | Without |
|---|---|---|
| Sonnet-built site | 6 of 6 | 5 of 6 |
| Opus-built site | 6 of 6 | 3 of 6 |

One run per cell, so a second run could move any number. Both plain runs read the login redirect check and called it safe; the
skill's entry on that pattern (`SEC-AUTH-01`) is why its runs caught it. The legal half has not been tested this way.
