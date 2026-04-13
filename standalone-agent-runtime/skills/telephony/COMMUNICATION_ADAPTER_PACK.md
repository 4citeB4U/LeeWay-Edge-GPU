# SKILL: telephony.google_voice.answer_and_route

## PURPOSE
To monitor local Google Voice sessions, answer incoming calls, and route the transcript to the correct department agent.

## ACTIONS
- **detect_ui**: Watch browser for incoming call banner.
- **audio_handshake**: Verify local microphone and speaker are routed to the browser.
- **transcribe_live**: Stream local audio to STT for intent detection.

## WORKFLOW
1. **Identify Caller**: Cross-reference incoming number with CRM/Memory.
2. **Greet**: Play pre-recorded or local TTS greeting ("You've reached [Business], how can we help?").
3. **Intent Detection**: Map the first 10 words to a skill family (e.g., "Brakes" -> Auto Mechanic).
4. **Handoff/Wait**: If logic is clear, provide answer; if complex, alert the human Architect.

---

# SKILL: email.gmail.prioritize_and_draft

## PURPOSE
To triage the local Gmail inbox and prepare high-value drafts for the Architect to review.

## WORKFLOW
1. **Inbox Scan**: Search for "Unread" messages in the last 4 hours.
2. **Sentiment Analysis**: Score each email for Urgency, Risk, and Opportunity.
3. **Retrieve Context**: Pull related threads from Memory.
4. **Draft Response**: Create a reply in the "Drafts" folder using the company's Tone Guide.
5. **Notification**: Send a local notification: "Draft ready for review: [Subject]".
