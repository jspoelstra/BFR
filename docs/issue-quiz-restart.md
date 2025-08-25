# Quiz: Restart button does nothing after completing a quiz

## Observed Behavior
After finishing a quiz and reaching the results screen, clicking the "Restart" (or similarly labeled) button results in no action: the quiz does not reset, a new set of questions is not loaded, and the UI state remains unchanged. No visible error is shown.

## Impact
- Users cannot immediately retake a quiz to reinforce learning.
- Forces manual navigation away and back (poor UX).
- Hinders rapid practice loops.

## Steps to Reproduce
1. Open the app and navigate to Quiz mode.
2. Take a quiz to completion until the results/summary screen appears.
3. Click the "Restart" button.
4. Observe that nothing changes—quiz is not reinitialized.

## Expected Behavior
Clicking Restart should:
1. Reset internal quiz state (current question index, score, answer selections, completion flag).
2. Generate (or reselect) a fresh question set (or the same set if design dictates) and display question 1.
3. Return focus to the first question heading (accessibility) and update any progress indicators.

## Acceptance Criteria
- Restart button fully reinitializes quiz state and displays the first question.
- Focus management: focus moves to the primary quiz heading or the first answer choice for keyboard/screen-reader users.
- Score/progress counters reset (no residual values from prior run).
- Works across multiple consecutive restarts without a full page reload.
- No console errors.
- (If question randomization exists) New randomized order on each restart OR documented consistent behavior.

## Diagnostics Suggestions
- Inspect handler bound to Restart button (ensure it calls a state reset function and triggers a re-render).
- Verify that completion flag (e.g., `quizDone`, `currentIndex >= questions.length`) is cleared.
- Confirm event listener is not being added conditionally and skipped post-completion.

## Potential Root Causes (Hypotheses)
- Missing onClick handler wiring after transitioning to results view.
- State object mutated without triggering DOM re-render.
- Guard clause preventing re-init if a "completed" flag remains true.

## Additional Enhancements (Optional)
- Provide a small toast or visually hidden live region announcement: "Quiz restarted." for screen readers.
- Offer a prompt if the quiz was partially complete when hitting Restart (future improvement).

## Environment
- Branch: main (current date)
- App type: static site served via `python3 -m http.server`

## Labels
- bug
- design (UX/accessibility focus for restart behavior)
