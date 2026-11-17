# Condom report: <app name>

<date> · mode: <full | security | legal | quick> · checked by Claude with the Condom skill

> This is an automated first pass, not legal advice and not a penetration test. It lists what was checked, what was found and what
> wasn't looked at. Items marked **lawyer** need one.

## What would hurt first
1. <finding, in one sentence the owner would say out loud> → <the fix, and who does it>
2. ...
3. ...

## Do these now (owner)
- [ ] <rotate the exposed key: which, where it was found (first four characters only)>
- [ ] ...

## The app
<the profile block from references/profile-signals.md, including what was assumed>

## Security findings
| # | Finding | Status | Severity | Where |
|---|---|---|---|---|
| 1 | <plain-word name> (<ID>) | CONFIRMED | Critical | `path/file.ts:42` |

### 1. <plain-word name> (<ID>)
- **What could happen:** <one sentence>
- **Evidence:** <file:line, config value, or the request and the response; secrets masked>
- **Fix:** <specific>. **Who:** Claude | owner
- **Source:** <link>

<repeat per finding, worst first>

## Legal findings
### Applies to you now
| # | Gap | Law | Exposure | Who fixes |
|---|---|---|---|---|
| 1 | <plain-word gap> (<ID>) | <law, section> | <penalty as stated; who can sue> | Claude / owner / lawyer |

### 1. <plain-word gap> (<ID>)
- **Why it applies:** <the threshold and the fact that meets it>
- **What's missing:** <evidence from the code or the site>
- **Fix:** <specific>. **Who:** Claude | owner | lawyer
- **Status and source:** <in force / from date> · <link> · read <date>

### Doesn't apply to you yet
| Law | Why not | What would change that |
|---|---|---|
| <law> | <the threshold you're under> | <the trigger> |

### Couldn't tell
| Question | Why it matters |
|---|---|
| <what the owner needs to answer> | <which entries turn on it> |

## Checked and clear
<a compact list: ID and plain name, grouped by reference file. This is the coverage.>

## Not checked
| What | Why |
|---|---|
| <area or entry> | <no access / needs the owner / out of scope> |

## Fix log
<filled in during fix mode>
| Finding | Change | Re-test | Commit |
|---|---|---|---|
| <ID> | <what changed> | <the proof that it now fails> | <hash> |

## Still open
- <what is left, and who it waits on>
