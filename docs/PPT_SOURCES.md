# HACKSPIRE ’26 — Claim-to-Source Ledger

This ledger separates repository evidence, technical references, conceptual background, and selected submission wording. Development tests and fixtures are not independent proof of real-world performance.

| Slide | Claim | Source location | Limitation |
|---|---|---|---|
| 1 | ClashPoint checks meeting decisions against recorded facts | `README.md`; implemented meeting console and `/api/analyze-turn` route | Describes the prototype, not a deployed production system |
| 1 | Team, theme, problem statement, and category | Approved submission defaults in `docs/PPT_PLAN.md` | Theme is descriptive and not verified as an official HACKSPIRE track |
| 2 | Short reply is resolved using preceding conversational context | `src/lib/analysis.ts` (`resolveEvent`) and language regression tests | Demonstrated on development cases |
| 2 | GH-42 can create an evidence-backed blocker warning | Seed fact `F-DEP-1`; collision and verification logic in `src/lib/analysis.ts` | Fixture data; not live GitHub access |
| 2 | User can inspect or dismiss evidence | Meeting UI components in `src/` | Human interaction exists in the prototype only |
| 3 | Script, typed, and browser speech inputs | Meeting UI and input-mode implementation in `src/` | Browser speech support varies by browser and device |
| 3 | Request includes the current turn and up to eight recent turns | Shared request schema and browser meeting state | Bounded prototype context, not long-term memory |
| 3 | Zod validates `/api/analyze-turn` | API route and shared schemas in `src/` | Local prototype endpoint |
| 3 | Gemini is optional and disabled by default | Gemini adapter and environment configuration | No credential is required for deterministic operation |
| 3 | Facts are filtered by principal and active status before checks | Fixture store and analysis pipeline | Seeded fixtures; no live connector synchronization |
| 3 | Evidence references are verified against known fact IDs | Verification logic and tests | Applies to supplied fixture facts |
| 3 | No database | Repository architecture and fixture store | Production persistence is out of scope |
| 4 | 41 automated tests pass | Local repository test run during deck inspection | Development tests, not an independent benchmark |
| 4 | 27/27 frozen demo cases pass | Frozen evaluation test suite | Fixed development corpus; not real-world accuracy |
| 4 | Pause, Stop, and Reset cancel stale work | Lifecycle implementation and tests | Tested prototype behavior |
| 4 | Script/manual are fallbacks for microphone limitations | UI fallback implementation | Live venue microphone rehearsal remains pending |
| 5 | Legal approval can qualify a customer commitment | Seeded legal fact and deterministic collision rules | Illustrative fixture scenario; not legal-compliance enforcement |
| 5 | Stakeholder outcomes are intended benefits | Inference from demonstrated evidence and safer-wording behavior | No pilot or measured business impact |
| 6 | Conversational grounding is relevant conceptual background | Clark & Brennan, *Grounding in Communication* (1991), https://www.cs.cmu.edu/~illah/CLASSDOCS/Clark91.pdf | Conceptual reference; does not validate ClashPoint performance |
| 6 | SpeechRecognition has browser/service limitations | MDN, https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition | Browser behavior can change over time |
| 6 | Route Handlers support the request architecture used | Next.js documentation, https://nextjs.org/docs/app/getting-started/route-handlers | Technical documentation, not product evidence |
| 6 | Prototype implementation is represented by commit `d3db372` | Private repository, https://github.com/Xenon010101/ClashPoint/tree/d3db372 | Private link; not a public judge demo |

## Artifact notes

- `HACKSPIRE26_FINAL.pptx` contains editable text, shapes, connectors, and a native reference table.
- `HACKSPIRE26_FINAL.pdf` is a deterministic six-page submission export with clickable reference regions on slide 6.
- The seventh instruction slide from the source template is absent.
