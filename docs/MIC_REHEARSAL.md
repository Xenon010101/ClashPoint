# Venue Microphone Rehearsal

Run this on the laptop and browser that will be used for the demo. It is a human acceptance checklist; do not mark `INPUT-03` complete until every required item has been observed.

1. Run `pnpm demo:preflight` from the repository root.
2. Start `pnpm dev`, open `http://localhost:3000` in current Chrome or Edge, and select **Microphone** before starting the meeting.
3. Select **Listen as Maya** and allow the browser microphone permission.
4. Speak a final operational turn, such as “Let’s promise Feature X to Acme by Friday.” Confirm that interim text is visibly provisional and the final turn appears in the transcript ledger.
5. Confirm the resulting policy card can open its evidence drawer and that the source is labelled **Demo fixture**.
6. Stop and restart recognition once. Pause, Resume, and Reset once each; confirm no stale transcript or card appears.
7. Deny permission (or use a browser without `SpeechRecognition`) once. Confirm the app names the limitation and immediately leaves **Script** and **Manual** usable.
8. Run the three-beat Script demo once as the venue fallback.

Record the browser/version, date, and outcome in the hackathon notes. If microphone recognition fails, use Script or Manual mode during judging; do not represent it as a working live-transcription integration.
