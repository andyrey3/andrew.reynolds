"""Fails if any page on the site could run code that isn't one of the site's own files.

Every app here shares one web address, so any page that lets injected or
third-party scripts run could read the others' saved data, including
Morsel's Claude API key. Each page must:
  - set a Content-Security-Policy meta tag,
  - only allow scripts from the site itself ('self'), or none at all,
  - never allow inline scripts, eval, or scripts from other hosts,
  - block plugins (object-src) and <base> tag tricks (base-uri),
  - contain no inline <script> blocks or on...= event handler attributes.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
ALLOWED_SCRIPT_SOURCES = {"'self'", "'none'", "'wasm-unsafe-eval'"}
CSP_RE = re.compile(r'<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"', re.I)
INLINE_SCRIPT_RE = re.compile(r"<script\b(?![^>]*\bsrc=)[^>]*>\s*\S", re.I)
HANDLER_RE = re.compile(r"<[a-z][^>]*\son[a-z]+\s*=", re.I)
JS_URL_RE = re.compile(r"""(href|src|action)\s*=\s*["']?\s*javascript:""", re.I)

problems = []
pages = sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts)
for page in pages:
    rel = page.relative_to(ROOT)
    html = page.read_text(encoding="utf-8", errors="replace")
    m = CSP_RE.search(html)
    if not m:
        problems.append(f"{rel}: no Content-Security-Policy meta tag")
        continue
    directives = {}
    for part in m.group(1).split(";"):
        bits = part.split()
        if bits:
            directives[bits[0].lower()] = bits[1:]
    default = directives.get("default-src")
    script = directives.get("script-src", default)
    if script is None:
        problems.append(f"{rel}: no script-src or default-src, so any script is allowed")
    else:
        bad = [s for s in script if s not in ALLOWED_SCRIPT_SOURCES]
        if bad:
            problems.append(f"{rel}: script-src allows {' '.join(bad)}")
    for name in ("object-src", "base-uri"):
        value = directives.get(name, default if name == "object-src" else None)
        if value != ["'none'"]:
            problems.append(f"{rel}: {name} should be 'none'")
    if INLINE_SCRIPT_RE.search(html):
        problems.append(f"{rel}: inline <script> block (move it into a .js file)")
    if HANDLER_RE.search(html):
        problems.append(f"{rel}: on...= event handler attribute (use addEventListener in a .js file)")
    if JS_URL_RE.search(html):
        problems.append(f"{rel}: javascript: URL")

if problems:
    print("Security check failed:\n  " + "\n  ".join(problems))
    sys.exit(1)
print(f"Security check passed: {len(pages)} pages only run the site's own scripts.")
