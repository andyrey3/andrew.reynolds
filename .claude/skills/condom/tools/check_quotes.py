"""Check that every quote in a reference file's Source lines appears on the page it cites.

Usage: python check_quotes.py <reference.md> [more.md ...]
For each entry it makes one plain request to each cited URL (cached in tools/.cache), strips the page to text and looks for each
quoted string that follows that URL. Prints one line per quote: OK, MISSING (page fetched, quote not on it) or
FETCH (the site refused a plain request, or it is a PDF: open it by hand). MISSING and FETCH are for a person to open and settle; this proves presence, not meaning.
"""
import hashlib
import html
import os
import re
import sys
import urllib.request

CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache")
os.makedirs(CACHE, exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"


def norm(s):
    s = html.unescape(s)
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    s = s.replace("–", "-").replace("—", "-").replace(" ", " ")
    s = re.sub(r"[`*_'\"]", "", s)  # quote marks differ between a page and a quote of it
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\s+([,.;:)\]])", r"", s)  # pages put spaces before punctuation around links and code
    s = re.sub(r"([(\[])\s+", r"", s)
    return s.strip().lower()


def page_text(url):
    key = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest() + ".txt")
    if os.path.exists(key):
        return open(key, encoding="utf-8").read()
    if url.lower().split("?")[0].endswith(".pdf"):
        try:
            import fitz  # PyMuPDF, if it is installed

            req = urllib.request.Request(url, headers={"User-Agent": UA})
            doc = fitz.open(stream=urllib.request.urlopen(req, timeout=60).read(), filetype="pdf")
            text = norm(" ".join(page.get_text() for page in doc))
            # a PDF breaks words across lines with a hyphen: join them
            text = re.sub(r"(\w)- (\w)", r"\1\2", text)
            open(key, "w", encoding="utf-8").write(text)
            return text
        except Exception as e:  # noqa: BLE001
            return "FETCHERROR pdf " + str(e)[:100]
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
        raw = urllib.request.urlopen(req, timeout=40).read()
    except Exception as e:  # noqa: BLE001
        return "FETCHERROR " + str(e)[:120]
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")
    text = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = norm(text)
    open(key, "w", encoding="utf-8").write(text)
    return text


def check(path):
    cur = "?"
    ok = missing = fetch = 0
    lines = []
    for raw_line in open(path, encoding="utf-8"):
        # an entry may be hard-wrapped: fold indented continuation lines into the bullet they belong to
        if raw_line.startswith("  ") and lines and lines[-1].lstrip().startswith("- "):
            lines[-1] = lines[-1].rstrip() + " " + raw_line.strip()
        else:
            lines.append(raw_line)
    for line in lines:
        m = re.match(r"###\s+(\S+)", line)
        if m:
            cur = m.group(1)
        if "**Source:**" not in line:
            continue
        parts = re.split(r"(https?://[^\s·)\]]+)", line)
        for i in range(1, len(parts), 2):
            url = parts[i].rstrip(".,;")
            after = parts[i + 1] if i + 1 < len(parts) else ""
            quotes = re.findall(r'"([^"]{12,})"', after.replace("“", '"').replace("”", '"'))
            if not quotes:
                continue
            text = page_text(url)
            for q in quotes:
                nq = norm(q).rstrip(".,:;!? ")
                if nq.startswith("about ") or len(nq) < 16:
                    continue  # a short phrase in a note, not a source quote
                # allow an ellipsis in the quote: every piece must be present, in order
                pieces = [p.strip().rstrip(".,:;") for p in re.split(r"\.\.\.|…|\[\.\.\.\]", nq) if len(p.strip()) > 8]
                if text.startswith("fetcherror") or len(text) < 400:
                    fetch += 1
                    print(f"FETCH   {cur}  {url}  ({text[:80]})")
                    break
                pos, good = 0, True
                for p in pieces:
                    j = text.find(p, pos)
                    if j < 0:
                        good = False
                        break
                    pos = j + len(p)
                if good:
                    ok += 1
                else:
                    missing += 1
                    print(f"MISSING {cur}  {url}\n        \"{q[:150]}\"")
    print(f"== {os.path.basename(path)}: {ok} quotes found, {missing} missing, {fetch} pages unreadable")


if __name__ == "__main__":
    for p in sys.argv[1:]:
        check(p)
