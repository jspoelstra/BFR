# Study view: Group overly granular section list into logical topics

## Problem
The current Study pane presents a long, flat list of highly granular FAR Part 91 sections. This is overwhelming, forces excessive scrolling, and makes it harder for users (especially during BFR prep) to build a mental model of related regulation themes. Cognitive load increases because the user must self-cluster sections.

## Why it Matters
- Reduces friction for new users learning structure of Part 91.
- Encourages topic-focused study sessions (e.g., "Equipment & Instruments" before "Operations in Controlled Airspace").
- Supports future adaptive/quiz topic filtering.
- Improves mobile usability by collapsing large lists.

## Proposed Approach
Introduce a two-level navigation in Study mode:
1. Topic (group) selection view.
2. Section detail list within the chosen topic.

Each topic groups semantically related sections (not necessarily mirroring CFR Subparts exactly if a learner-centric grouping is clearer). A topic card/tile or list item shows: title, brief description, count of sections, and completion progress (e.g., 8/15 read).

### Candidate Topic Groups (Initial Draft)
| Topic | Coverage (examples) | Notes |
|-------|---------------------|-------|
| General & Definitions | 91.1, 91.3, 91.7, 91.9 | PIC authority, airworthiness, compliance scope |
| Equipment & Instruments | 91.205, 91.207, 91.213, 91.215, 91.225 | Required equipment, inoperative handling, ELT, transponder, ADS-B |
| Flight Operations & Limitations | 91.13, 91.17, 91.21, 91.103, 91.111–91.117 | Careless/reckless, alcohol, preflight action, formation, right of way |
| Altitudes & Airspace Entry | 91.119, 91.126–91.131, 91.135 | Min altitudes, Class G/E/D/C/B procedures |
| Speed & Performance Limits | 91.117, 91.155 | Airspeed limits, VFR weather minima (consider splitting) |
| VFR Weather & Fuel | 91.151, 91.155, 91.157 | Fuel reserves, weather minima, SVFR |
| IFR Rules (Intro subset) | 91.167–91.173 (selected) | Basic IFR fuel & alternate requirements (if included in scope) |
| Maintenance & Inspections | 91.403–91.417 (selected) | Operator responsibilities, maintenance records |
| Special Operations & Equipment | 91.307 (parachutes), 91.319 (experimental), 91.323–91.327 (LSA) | Could optionally be advanced grouping |
| Operational Deviations & Emergencies | 91.3(b), 91.123, 91.137–91.145 | ATC compliance, TFRs, emergency authority |

(Exact mapping to be finalized—this issue covers design + implementation.)

## Functional Changes
- Replace flat list with topic grid/list. Selecting a topic drills into a filtered list of its sections.
- Provide a breadcrumb or back button ("All Topics").
- Maintain existing per-section read progress; compute topic progress dynamically.
- Search behavior options (pick one in implementation):
  1. Global search across all sections (shows grouped results with topic headers), OR
  2. Contextual search limited to the currently selected topic with an option to "Search all topics".
- Persist last selected topic in existing state persistence mechanism (e.g., localStorage state object).

## Data / Structure
Add a JS module or object mapping topic IDs to arrays of section IDs (DOM IDs or citation strings). Example skeleton:
```js
export const TOPIC_MAP = {
  general: { title: 'General & Definitions', sections: ['91.1','91.3','91.7','91.9'] },
  equipment: { title: 'Equipment & Instruments', sections: ['91.205','91.207','91.213','91.215','91.225'] },
  // ...
};
```
Section IDs should match whatever current Study view uses to identify/scroll to sections.

## Acceptance Criteria
- A new topic selection layer is visible instead of the raw master list on initial Study view load (unless a last topic is persisted).
- Drilling into a topic shows only that topic's sections with existing interaction (mark read, open details, etc.).
- Progress indicator for each topic: shows count of sections read / total and a percentage or progress bar.
- Breadcrumb or back control returns to topic list without losing progress state.
- Search solution implemented (global or contextual) and documented in code comments.
- No regression to existing per-section progress tracking or export/import.
- Fully keyboard and screen-reader accessible (topic items focusable, aria-labels or descriptive text).
- Mobile layout handles topic grid and nested list cleanly (< 400px width).

## Out of Scope (for this issue)
- Advanced filtering/tagging beyond first-level topics.
- Multi-select topics or custom user-defined group creation.

## Follow-on Opportunities
- Topic-based quizzes.
- Adaptive learning suggestions ("You’ve read 20% of Equipment, continue?").
- Show time spent per topic.

## Labels
- design
- enhancement

## Definition of Done
All acceptance criteria met, code merged, and README or in-app help updated briefly to mention topic-based navigation in Study mode.
