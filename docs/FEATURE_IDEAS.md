# Feature Ideas

Candidate capabilities for after SRD 013, brainstormed on 2026-11-01. **None of these is agreed or
scheduled.** When one is chosen, write an SRD for it under `specs/` (as with
`specs/013-classroom-hardening/srd.md`) and mark it here.

The ideas assume the current constraints:

- the app runs offline from local files;
- students share the instructor's machine (SRD 013 owner decision);
- authors only use Oxygen and never a command line.

Value and cost are rough guesses.

## Recommended first

1. **Per-question analytics.** It is cheap, the data already exists, and it improves the content itself.
2. **Backup and restore file.** It closes the one path where cohort data can be lost for good.
3. **Explanations, with hints alongside.** This is the biggest learning gain, and authoring stays in DITA.

**Exam mode** is the largest change in value, but only if scores will be used for formal
assessment. Decide that first.

## Quick wins

| Idea | Value | Cost | Notes |
|---|---|---|---|
| **Per-question analytics** in the scores view: % right first time, and the wrong MCQ option chosen most often | High: shows badly worded questions and teaching gaps | Low | `attempts`, `firstSuccess` and the answers are already stored (schema v3) |
| **Publish-time MCQ range check**: stop the build when an answer number is larger than the number of options | Medium: catches a silent authoring error | Low | Goes beside the checks in `quizAnswerEncoding.xsl`. Related open item: no runtime validation banner for authoring errors (`MAINTAINERS.md` §6) |
| **Instructor backup and restore** as a JSON file the instructor saves and loads | High: clearing browser data, or Erase All Data, removes the whole cohort | Low–Medium | Offline-safe. The `backups` object store exists but is never written (`MAINTAINERS.md` §6). Use the same instructor re-authentication as Erase All Data |
| **Printable per-student report** (print styles on the scores view) | Medium: a paper record with no network | Low | |

## Learning value

| Idea | Value | Cost | Notes |
|---|---|---|---|
| **Explanations**: an author-written "why" note per question, shown after a correct answer or after N tries | High | Medium | Needs a DITA convention, for example an element with output class `qd-explain` inside the Detail cell. It must be encoded like the answers, or it gives them away |
| **Hints** shown after the first wrong attempt | Medium | Medium | Same mechanism as explanations, so build both together |
| **"My mistakes" page**: every wrong or unanswered question across the publication, with links | Medium | Low–Medium | Most of the data is already in the session cache |
| **Model answers for analysis tables**, revealed by the instructor for side-by-side comparison | Medium–High | Medium | Analysis work is captured (SRD 013 WP4) but nothing marks it |

## Assessment

| Idea | Value | Cost | Notes |
|---|---|---|---|
| **Exam mode**: one attempt, no right/wrong feedback, answers locked, instructor releases results | High if scores are used for assessment | Medium–High | With unlimited retries today, scores only support learning. Needs a switch per publication or per page (a scenario parameter or a table output class). Interacts with SCO-01 (attempt recording) |
| **Gram hotspot questions**: the student clicks the feature on a sonar gram image, and the click is checked against an authored region | High: fits the subject closely | High | New question type. Needs a way to author regions in DITA, and region encoding |
| **Multi-select and ordering questions** | Low–Medium | Medium | General-purpose; no current content needs them |

## Considered and not recommended

- **Hashing answers instead of encoding them.** An MCQ with four options falls to four guesses,
  and a numeric answer with a tolerance cannot be checked against a hash. It would add complexity
  and look stronger than it is. See `docs/SECURITY.md` for what the encoding does and does not do.
- **Live classroom dashboard.** On one shared machine there is no class to watch at the same time.
- **Merging results from several machines.** This matters only if the classroom setup changes.
  The backup file covers the real risk, which is data loss. Revisit if students move to their
  own machines.

## Loose ends noticed at the same time

These are not features. They were seen while publishing the walkthrough and regenerating
`dita-demo/`:

- `tests/e2e/workflows/dita-instructor-flow.spec.ts` "View student answers" fails intermittently
  on a local machine (3 of 5 runs). It runs out of its 5 s test budget. It passes in CI.
- `search.html` still loads WebHelp's search script, which throws `null.trim` when opened without a
  query. Nothing links to the page now, so the impact is cosmetic.
- `dita-demo/` was protected with `npm run protect-dita-demo`, not by an Oxygen publish. The first
  real publish with the current template is still the proof that the template works.
