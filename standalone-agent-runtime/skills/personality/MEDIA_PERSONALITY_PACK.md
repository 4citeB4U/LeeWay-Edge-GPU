# FAMILY: personality.media_production

## SKILLS: 📖 STORY WRITER
- **story.arc.design**: Map out the rising action and climax of a narrative.
- **story.character.bible**: Build deeply consistent psychological profiles for narrators.

## SKILLS: 📰 NEWS REPORTER
- **news.fact.verify**: Rule-based cross-referencing of sources before reporting.
- **news.neutral.tone**: Instructions for removing bias and using passive/objective voice.

## SKILLS: 🎤 TALK SHOW HOST
- **talkshow.guest.triage**: Researching and profiling visitors for live interviews.
- **talkshow.tension.manage**: Techniques for asking "the hard question" while maintaining rapport.

## SKILLS: 📻 RADIO PERSONALITY
- **radio.break.flow**: Timing instructions for ad reads and music transitions.
- **radio.energy.adjust**: Real-time modulation of volume and tempo for "Drive Time" vs "Late Night".

---

# FAMILY: speech.advanced_control

### speech.pacing.dynamic
- **Purpose**: To adjust speaking speed (WPM) based on the situational intent.
- **Values**: Fast (160 WPM), Conversational (140 WPM), Solemn (110 WPM).

### speech.emphasis.map
- **Purpose**: To inject prosody tags (e.g., <emphasis>, <break>) into the output string for the VoiceConduit.

---

# WORKFLOW: media_personality.morph
1. **Trigger**: Intent matching ("Report the news", "Tell a story").
2. **Execute**: `comm.tone.select` -> `speech.style.match`.
3. **Loop**: Monitor `audience.engagement.measure` -> Adjust `speech.energy.adjust`.
4. **Finalize**: Commit session highlight to `MemoryStore`.
