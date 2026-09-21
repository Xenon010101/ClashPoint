# HACKSPIRE ’26 — Final Slide Content

## Slide 1 — CLASHPOINT

Checks product-team decisions against recorded facts during meetings.

- Team Name: Team ClashPoint
- Theme: AI for Workplace Productivity
- Problem Statement: Detecting Conflicting Decisions During Product Meetings
- PS Category: Software
- Working prototype

## Slide 2 — IDEA / PROPOSED SOLUTION

**01 · Meeting statement**

“Are all the Acme blockers cleared?”  
“Yeah.”

**02 · ClashPoint check**

Resolve the reply using the preceding question.  
Compare the resulting claim with authorized project facts.

**03 · Evidence-backed warning**

“SSO release is blocked by Auth Refactor. GH-42 remains open.”  
Inspect the source before confirming release readiness.

- Context-aware — Resolves short replies
- Traceable — Exact stored evidence
- Proportionate — Warnings vs conflicts
- Human-controlled — Inspect or dismiss

Example uses seeded demo data.

## Slide 3 — TECHNICAL APPROACH

**Browser**

- Next.js · React · TypeScript
- Script · Typed turn · Browser speech
- Final turn + up to 8 recent turns

**POST /api/analyze-turn · Zod**

**Optional Gemini**  
Unfamiliar phrasing only · disabled by default

**Server sequence**

1. Resolve event — Deterministic conversation rules
2. Decision gate — Ignore · Quiet · Immediate
3. Filter + retrieve — Principal permissions · Active facts
4. Check conflicts — Status · dependency · capacity
5. Verify evidence — Known fact IDs · exact quotes
6. Return card — Warning / conflict · safer wording

Ignore → terminate without collision check

**Server fixture store**  
GitHub · Notion · Capacity policy  
Seeded data · no database

## Slide 4 — FEASIBILITY AND VIABILITY

**Working today**

- Local demo without Gemini credentials
- Script, manual input, and evidence inspection
- 41 automated tests passing
- 27/27 frozen demo cases passing

Development fixtures — not an independent benchmark or real-world accuracy claim.

| Risk | Response |
|---|---|
| Browser speech unavailable | Use script or manual input |
| Ambiguous language | Leave short references unresolved |
| Delayed responses | Cancel stale work on Pause, Stop, or Reset |
| Limited source coverage | Label fixtures and show exact evidence |

Live microphone rehearsal remains pending.

## Slide 5 — IMPACT AND BENEFITS

**Without a source check**

“Promise Feature X by Friday.”  
The commitment proceeds without checking the recorded approval requirement.

**With ClashPoint**

The promise triggers an evidence-backed conflict.  
“Do not proceed with Feature X until the DPA update is approved.”

**Suggested response**

“We’re targeting Friday, pending final Legal approval.”

- Product lead — Qualify the customer commitment
- Engineering lead — Review blockers and workload
- Approval owner — Make prerequisites visible

Illustrative scenario. Intended benefits; no measured business impact yet.

## Slide 6 — RESEARCH AND REFERENCES

| Purpose | Reference | Relevance |
|---|---|---|
| Conversation design | Clark & Brennan, *Grounding in Communication* (1991) | Conceptual background on conversational grounding |
| Browser input | MDN, *SpeechRecognition* | Browser support and recognition-service limitations |
| Server architecture | Next.js, *Route Handlers* | Request handling used by the prototype |
| Prototype evidence | ClashPoint repository, commit `d3db372` | Implementation, fixtures, and automated tests |

Prototype evidence uses development fixtures. Business benefits have not been measured in a pilot.  
Repository link is private and is not a public judge demo.
