# Scenario-based quiz questions for Part 91

## Background
The current quiz covers factual knowledge well, but pilots benefit from scenario-based questions that require applying FAR Part 91 to realistic situations. This issue proposes authoring a set of scenario-driven questions (with explanations and citations) and ensuring the quiz UI can present explanations after answering.

## Example (user-provided)
- Scenario: You arrive to depart VFR and discover the magnetic compass is inoperative. Weather is VFR and all other systems are normal. Can you fly?
- Correct answer: No.
- Rationale: A magnetic direction indicator is required equipment for VFR day under §91.205(b). Because it’s required (and absent), §91.213(d) relief does not apply unless an MEL authorizes deferral (most small GA aircraft do not have an MEL). Cite §91.205(b)(3), §91.213.

## Additional sample scenarios to include
- VFR night with landing light inoperative; not for hire. Can you depart? (91.205(c)(4) landing light required only if for hire; position lights and anti-collision lights still required.)
- Transponder/ADS-B out inoperative in Class C; can you depart? (91.215/91.225 allow ATC authorization with advance request.)
- ELT inoperative discovered before flight; can you fly today? (91.207 outlines allowances, temporary operation to repair/replace, placard/logbook.)
- Fuel requirements: planned VFR day cross-country landing with 25 minutes fuel remaining; compliant? (91.151 requires 30 min reserve day, 45 min night.)
- Minimum safe altitudes over congested area scenario (91.119) and sparsely populated area with pipeline inspection nuance.

## Acceptance Criteria
- Author at least 12–20 scenario-based multiple-choice questions spanning:
  - Required vs inoperative equipment (§91.205, §91.213)
  - Fuel/reserves (§91.151)
  - Minimum altitudes (§91.119)
  - Transponder/ADS-B authorizations (§91.215, §91.225)
  - Night VFR equipment nuances (§91.205(c))
- Each question contains:
  - A clear scenario stem (2–5 sentences) with relevant conditions (day/night, airspace, aircraft type/mission, weather, equipment status).
  - 4 answer options (A–D) with one correct answer.
  - An explanation (1–3 sentences) and citations to specific FAR sections (e.g., “§91.205(b)(3), §91.213(d)”).
- Add the questions to the quiz question bank/data in a way consistent with project structure (or create a dedicated data file if needed) and wire them into the Quiz view.
- Quiz UI displays the explanation and citations after the user answers (either immediately or on review screen).
- Lint and run locally; verify the new questions appear and behave as expected.

## Nice-to-have
- Tag scenarios with topic (e.g., Equipment, Fuel, Altitudes) to allow filtered quizzing.
- Include a short link or anchor to the reference in `data/part91.html` where practical.

## References
- §91.205 (Required equipment)
- §91.213 (Inoperative instruments and equipment)
- §91.151 (Fuel requirements for flight in VFR conditions)
- §91.119 (Minimum safe altitudes)
- §91.215 (ATC transponder and altitude reporting equipment)
- §91.225 (Automatic Dependent Surveillance—Broadcast (ADS–B) Out)
