---
name: local-news
description: The daily entry point for the local newsroom — invoke as "/local-news today" (or with a specific date) to discover genuinely new local stories from the configured sources, skip anything already covered, fact-check and draft the strongest candidates, and produce a Daily Newsroom Report. Also handles the editor's "Approve N / Reject N / Publish N / Review N" commands afterward, backed by scripts/newsroom-action.ts. Generic across any local-information platform via .claude/city-config.json. Never publishes, never sends a newsletter, never generates an AI image, never pads the story count — only an explicit "Publish N" changes an article's status, and only for that one article.
---

# Local News — Daily Workflow

This is the day-to-day entry point for the local newsroom built from the
other six skills under `.claude/skills/`. It answers "what's the news
today" by running discovery → deduplication → ranking → fact-check →
drafting → image decision, and reporting the result — nothing more.

**This skill is city-agnostic by design.** All city-specific detail comes
from `.claude/city-config.json`. If you find yourself about to write a
specific city name, source, or URL into this file, stop — that belongs in
the config, not here.

## Invocation

Invoke as:

```
/local-news today
/local-news 2026-08-20
/local-news
```

No argument defaults to today's date (per `.claude/city-config.json`'s
timezone context — this project uses Asia/Kathmandu, matching
`src/lib/datetime.ts`'s `getNepalNow()`). A specific `YYYY-MM-DD` argument
runs the same workflow for that date instead.

This uses the project's existing skill-invocation mechanism (a skill
under `.claude/skills/` is invocable as `/<skill-name> <args>`) rather
than a new command mechanism — this project has no `.claude/commands/`
directory or other custom-command setup, and introducing one would
duplicate a mechanism that already does exactly this job. If a future
version of Claude Code adds a distinct slash-command layer, this skill
can be pointed at from a thin command file then; nothing here needs to
change to support that.

## What this skill does NOT do

- It does not publish anything, or change any article's `status` from
  `draft` to `published`, ever — **except** the one explicit
  `Publish <N>` action described in "Approval, review, and publication"
  below, which only ever acts on the single article named. Discovery,
  research, fact-check, drafting, image decision, `Approve`, and `Reject`
  never do this.
- It does not create or send a newsletter — that's
  `.claude/skills/local-newsletter/SKILL.md`'s job, integrated
  separately, not this milestone.
- It does not generate an AI image, or call any image-generation API.
- It does not pad the story count. If zero, one, or three stories
  genuinely qualify, that's what gets reported — never a fixed target.
- It does not treat local-newsroom-orchestrator's single-topic pipeline
  as a substitute for this skill's job: this skill's distinct value is
  discovery-time deduplication and multi-candidate ranking, which the
  orchestrator (built for one already-identified topic at a time) doesn't
  do.

## Workflow

```
1. Read city configuration
2. Discover candidate stories        (local-news-research)
3. Deduplicate against existing articles
4. Rank by local usefulness
5. Fact-check the strongest candidates  (local-fact-checker)
6. Discard candidates that can't be responsibly supported
7. Draft the survivors                  (local-article-writer)
8. Image decision for each draft        (local-image-editorial)
9. Produce the Daily Newsroom Report
10. Record the report + each story's workflow state (scripts/newsroom-action.ts)
```

Step 10 is what makes "Approve 1" / "Publish 1" possible afterward — see
"Approval, review, and publication" below. It is bookkeeping, not an
editorial decision: it persists what steps 1–9 already produced.

### 1. City configuration

Read `.claude/city-config.json` (or the equivalent file for whichever
city this is running for). Use its source list and hierarchy for step 2,
its category reference for step 7, and its image configuration for step
8. Do not hard-code any city-specific value here instead.

### 2. Discover candidate stories

Hand the request to `.claude/skills/local-news-research/SKILL.md`,
targeting the configured sources — actually read them (fetch, don't
assume), starting from the highest-priority group in the config. **Do not
use existing article text in `content/articles/` as a substitute for
source research** — that directory is what step 3 checks *against*, not a
research input. If a configured source is unreachable, report that
plainly (per that skill's own principles) rather than treating research
as having succeeded.

### 3. Deduplicate against existing articles

Before a candidate survives to ranking, check it against every article
already in the project's content directory — **all statuses**, not just
published, since an existing *draft* covering the same event is just as
much a duplicate as a published one. For each candidate:

- Search existing articles' `title`, `summary`, `source`, and `sourceUrl`
  for meaningful overlap with the candidate (same underlying notice, same
  event, same source document).
- **Ignore** — drop the candidate entirely, don't report it — if it's the
  same announcement already covered, including a source simply
  re-posting or lightly re-editing the same notice.
- **Keep, but flag the relationship explicitly** in the report's notes if
  it's a genuine new development on an existing story (a follow-up
  notice, new information, a status change) rather than a repeat. Say
  which existing article/slug it follows up on and what's actually new —
  never silently merge it into "this is new" or silently drop it as "already
  covered" when it isn't.

A candidate that fails this check never reaches fact-checking — this is a
discovery-time filter, distinct from (and earlier than) the slug-collision
check that `local-article-writer`/`local-newsroom-orchestrator` apply at
write time. Both checks matter: this one prevents redundant research and
drafting effort; the later one is the last-resort file-safety net.

### 4. Rank by local usefulness

Order surviving candidates using the same importance criteria
`local-news-research` already documents (immediate public relevance,
deadlines, services, transport/border, education, agriculture, business,
employment, community, environment, public safety) — never by how
attention-grabbing a story is. **Do not artificially target a fixed
number of stories.** Rank everything that survived step 3; step 6 (and
simply "how many genuinely qualify") determines the final count, not a
target.

### 5–6. Fact-check and discard

Run `.claude/skills/local-fact-checker/SKILL.md` on the strongest
candidates. Per that skill's own guidance, PARTIALLY VERIFIED claims
don't disqualify a story on their own — they get qualified in the draft.
**Discard a candidate** (don't draft it) only when there's no genuinely
verifiable core fact to report — every claim UNVERIFIED with no usable
source, or a central CONFLICTING claim that can't be reported honestly.

**A candidate blocked specifically by an unreadable PDF attachment is a
third case — neither "draft it" nor "discard it."** If
`local-news-research` produced an `EVIDENCE REQUIRED` block for this
candidate (see that skill's "Evidence requests" section) and the blocked
claims are the ones that would make the story worth writing, **do not
discard the story**. Hold it and report it under **PDF EVIDENCE
REQUIRED** in step 9 instead — listing exactly what can't currently be
verified — rather than silently dropping it or writing an article with
invented specifics to route around the gap. If the story already has
enough independently-verifiable substance to be worth a narrow, honestly-
qualified article even without the PDF (as in the two real examples this
project has already produced this way), draft it normally and note the
open evidence request in the draft's own text — both can be true at once.

### 7. Draft the survivors

For each candidate that passed fact-checking, hand its research + fact-
check output to `.claude/skills/local-article-writer/SKILL.md`, using the
city configuration for the frontmatter schema/language/category
references. Every draft carries `status: draft`.

**Writing to disk is optional for this version, and off by default.**
This skill's job is to produce the report and the proposed draft text —
the same pattern this project has already used (see the Milestone 5C/5D
history: propose and display first, save as an explicit separate action
only when asked). If a draft is actually saved to `content/articles/`:

- only create a genuinely new file — never overwrite an existing one
- always `status: draft`
- **stop on slug collision** and report it, exactly as
  `local-article-writer`/`local-newsroom-orchestrator` already do
- this is a second, independent safety net on top of step 3's
  deduplication — a candidate can pass deduplication (it's a genuine new
  story) and still collide on slug (someone already used that exact slug
  for something else); both checks apply

### 8. Image decision

For each draft, run `.claude/skills/local-image-editorial/SKILL.md`
against the city configuration's image library/manifest. Record one of:
an approved library image, a category placeholder, "AI illustration
recommended," or "no suitable image." **Never generate, download, or call
an image-generation API** — a recommendation is the entire output of this
step, exactly as `local-image-editorial` itself specifies.

### 9. Daily Newsroom Report

For every selected story, report:

```
TITLE: <headline>
SLUG: <proposed slug>
CATEGORY: <category>
SOURCE: <source name>
SOURCE URL: <url, or "none available">
DATE: <the notice/event date, preserved exactly as sourced>
IMPORTANCE: <why this made the cut — one or two sentences>
FACT-CHECK STATUS: <claim count and status breakdown>
IMAGE DECISION: <local-image-editorial's Decision line>
```

...followed immediately by that story's full proposed Markdown article
draft (frontmatter + body).

**If a story is a follow-up to an existing article**, add a line noting
the relationship (e.g. `RELATES TO: <existing slug> — <what's new>`).

**If a story is being held open because of an unreadable PDF** (see
step 5–6), report it in its own section instead of the normal per-story
block:

```
PDF EVIDENCE REQUIRED

TITLE: <headline>
SOURCE: <source name>
SOURCE URL: <url, or "none available">
DATE: <notice date, as sourced>
Claims blocked: <exactly what can't currently be verified>
Suggested action: <from local-news-research's EVIDENCE REQUIRED block —
  typically: supply the PDF via .claude/evidence/incoming/ and run
  npm run evidence:ingest>
```

Do not draft unsupported claims to fill this section in — it exists
precisely so a story with real potential doesn't get lost, without ever
pretending the missing evidence is already in hand.

If zero stories survive to this point, the entire report is exactly:

```
No sufficiently supported new local story found.
```

— not an empty section, not a placeholder story, not an explanation
padded out to look more substantial. Say plainly what was checked and
why nothing qualified (e.g. "checked N configured sources; M candidates
found; all were either already covered or could not be responsibly
supported") in a sentence or two after that line, but never invent a
story to avoid returning it.

### 10. Record the report

Persist what steps 1–9 produced, using
`scripts/newsroom-action.ts` (see `.claude/newsroom/README.md` for the
full design — this section only covers how `/local-news` uses it):

```bash
node --experimental-strip-types scripts/newsroom-action.ts start-report --date <YYYY-MM-DD>
```

Then, for each story that appeared in the report (including a
`PDF EVIDENCE REQUIRED` one — record it too, as `BLOCKED`, so `approve`
correctly refuses it later rather than having no record at all):

```bash
node --experimental-strip-types scripts/newsroom-action.ts record <slug> \
  --position <N> --title "<headline>" \
  --factCheckPassed --factCheckSummary "<claim count/status breakdown>" \
  --imageDecision "<local-image-editorial's Decision line>" \
  [--evidenceRequired]
```

If a draft was only proposed/displayed and not written to
`content/articles/` (the default — see step 7), still record it; `review`
and `approve` will correctly report "no article file exists yet" rather
than erroring, and `approve` will refuse until the file actually exists.

## Approval, review, and publication

Once a report is recorded, the editor drives it forward with plain
commands — resolve these to `scripts/newsroom-action.ts` invocations
rather than acting on the report from memory, so every safety gate below
is the script's, not a judgment call redone differently each time:

```
Approve 1        → node --experimental-strip-types scripts/newsroom-action.ts approve 1
Reject 2         → node --experimental-strip-types scripts/newsroom-action.ts reject 2 [--reason "..."]
Publish 1        → node --experimental-strip-types scripts/newsroom-action.ts publish 1
Review 1         → node --experimental-strip-types scripts/newsroom-action.ts review 1
```

`1`/`2` here mean *position in the currently-recorded report* — the
script resolves that to an exact slug itself (see
`.claude/newsroom/README.md`'s "stale-report protection"); never resolve
a position to a slug by hand or from memory of an earlier report. An
exact slug can always be given directly instead of a position.

**These conceptual workflow states — `DISCOVERED` → `FACT_CHECKED` →
`DRAFT_READY` → `APPROVED` → `PUBLISHED` (or `REJECTED` / `BLOCKED`) —
live only in `.claude/newsroom/state.json`. They are never written into
article frontmatter, and never replace the real article `status` field
(`draft`/`published`).**

### Approve

`approve <position-or-slug>` verifies: the story has a workflow record,
the article file exists, the article's `status` is still exactly
`draft`, the story isn't already `APPROVED`/`PUBLISHED`/`REJECTED`/
`BLOCKED`, its fact-check passed, and it has an image decision on record.
If every check passes, it sets the workflow state to `APPROVED` in
`state.json` — **it never touches the article file itself.** If any
check fails, it stops and states exactly which one, rather than
approving anyway.

### Reject

`reject <position-or-slug> [--reason "..."]` sets the workflow state to
`REJECTED` in `state.json` and records the reason. **It never deletes or
modifies the article file** — rejected editorial work stays on disk,
exactly as written, in case it's reconsidered later. It refuses to act on
an already-`PUBLISHED` story (this is not an unpublish mechanism).

### Publish

`publish <position-or-slug>` is the **only** action in this entire
newsroom that may change `status: draft` to `status: published`, and it
does so only after re-checking, in order: the article file still exists,
the story is currently `APPROVED` (not just `DRAFT_READY` — approval is
a separate, prior, explicit step), the article's on-disk `status` is
still literally `draft` (read fresh, not from a cached assumption),
fact-check passed, no evidence requirement is still open, an image
decision exists, and no unresolved safety issue is recorded. It prints a
concise confirmation summary (title, category, source, fact-check,
image decision) as part of the same invocation — the editor's explicit
"Publish N" command *is* the confirmation; there is no separate second
prompt. Only then does it flip the one `status:` line, update
`state.json` to `PUBLISHED`, and stop — **it never publishes more than
the single article it was told to publish**, and there is no batch/"publish
all approved" mode.

### Review

`review <position-or-slug>` is read-only: it prints the article's title,
summary, category, source, source URL, full body, image decision,
fact-check result, and evidence requirements, plus the current workflow
state — all sourced from the article file and `state.json`, nothing
invented. It never writes anything, to either file.

## No newsletter, no accidental publishing

This skill never creates or sends a newsletter (that's
`local-newsletter`'s job, wired up separately). **None** of
`/local-news`'s own steps (1–10), `Approve`, `Reject`, or `Review` ever
publish anything or change `status: draft` to `status: published` —
**only** an explicit `Publish <N>` action does that, and even then only
for the one article named, after every gate in "Publish" above passes.
Every draft this skill produces stays exactly what it started as until
that one explicit action: a proposal for a human editor.

## Reusability

To run this same daily workflow for a different local-information
platform, change only `.claude/city-config.json` (and that city's own
content directory / image library / source material it points at). The
six underlying skills, and this skill itself, remain unchanged — if
running this for a new city ever requires editing this file, that's a
sign a city-specific value leaked in here instead of into the config.
