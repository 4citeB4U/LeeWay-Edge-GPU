# Voice Pipeline

**LeeWay Industries | LeeWay Innovation — Created by Leonard Lee**

The LeeWay Edge RTC voice pipeline is **100% browser-native** — no external AI APIs, no vendor accounts, no network calls to third-party services. It runs entirely inside the client's browser using the Web Speech API.

---

## Pipeline Overview

```mermaid
graph LR
  MIC["🎙️ Microphone\n(getUserMedia)"]
  STT["SpeechRecognition\n(Web Speech API)"]
  BRAIN["respondToInput()\npersona.ts\nRule-based + context-aware"]
  TTS["SpeechSynthesis\n(Web Speech API)"]
  SPEAKER["🔊 Speaker"]
  RTC["RTC Context\nconnectionState\niceState / isRelay\npeer stats"]

  MIC -->|continuous audio stream| STT
  STT -->|transcript string| BRAIN
  RTC -->|live context injection| BRAIN
  BRAIN -->|response string| TTS
  TTS -->|speech| SPEAKER
```

---

## State Machine

```mermaid
stateDiagram-v2
  [*] --> idle : useVoiceLoop() mount
  idle --> listening : startLoop()
  listening --> processing : SpeechRecognition onresult (final)
  processing --> speaking : respondToInput() returns
  speaking --> listening : SpeechSynthesis onend (auto-restart)
  speaking --> listening : bargeIn() (user interrupts)
  listening --> idle : stopLoop()
  speaking --> idle : stopLoop()
  idle --> [*] : component unmount
```

---

## Module Map

| File | Purpose |
|---|---|
| [src/voice/voice-loop.ts](../src/voice/voice-loop.ts) | React hook `useVoiceLoop()` — orchestrates STT → Brain → TTS |
| [src/voice/persona.ts](../src/voice/persona.ts) | `respondToInput()` — local rule-based intelligence |
| [src/voice/voice-registry.ts](../src/voice/voice-registry.ts) | Runtime voice discovery, gender/quality classification |
| [src/voice/voice-presets.ts](../src/voice/voice-presets.ts) | 6 pinnable TTS profiles (3M + 3F) with localStorage persistence |
| [src/voice/emotion-engine.ts](../src/voice/emotion-engine.ts) | Text + context → `Emotion` → TTS rate/pitch/volume/pause deltas |
| [src/voice/speech-queue.ts](../src/voice/speech-queue.ts) | Priority TTS queue — HIGH barge-in, NORMAL standard, LOW ambient |
| [src/voice/audio.ts](../src/voice/audio.ts) | PCM worklet (optional WS voice server path) |
| [src/voice/poetry.ts](../src/voice/poetry.ts) | `getPoetryLine()` — ambient idle phrases for Agent Lee |
| [src/voice/types.ts](../src/voice/types.ts) | `VoiceMode`, `VoiceLoopState`, `RuntimeMode`, `SpeechPriority` types |

---

## Voice Modes

| Mode | Constant | Behaviour |
|---|---|---|
| RTC Operations | `VOICE_MODES.RTC_OPS` | Responds to WebRTC status queries (peers, ICE, relay, latency) |
| Ambient | `VOICE_MODES.AMBIENT` | Narrates system state poetically at low cadence |
| Silent | `VOICE_MODES.SILENT` | STT still runs, but TTS output is suppressed |

---

## Barge-In Support

When the user speaks while Agent Lee is talking, `bargeIn()` immediately:
1. Calls `speechQueue.clear()` — cancels current utterance and empties the queue
2. Restarts `SpeechRecognition` in continuous listen mode

---

Six pinnable voice profiles are stored in `voice-presets.ts`. The user's preferred preset is persisted in `localStorage` via `savePresetId()`.

| ID | Label | Gender | Base Rate | Pitch | Best for | Premium HD | Languages |
|----|-------|--------|-----------|-------|---------|:---:|:---:|
| M1 | Agent Lee — Premium HD | Male | 1.00 | 0.98 | Mission-critical command | ✅ | en, es, fr, de |
| M2 | Agent Lee — Calm (Studio) | Male | 0.88 | 0.92 | Routine status reports | ✅ | en, it, ja |
| M3 | Agent Lee — Alert (Ultra) | Male | 1.12 | 1.05 | High-energy security flags | ✅ | en, pt, ru |
| F1 | Agent ARIA — Premium | Female | 1.00 | 1.00 | Health monitoring readouts | ✅ | en, zh, ko |
| F2 | Agent ARIA — Warm | Female | 0.92 | 0.97 | Advisory recommendations | — | en, fr, nl |
| F3 | Agent ARIA — Technical | Female | 1.08 | 1.02 | Governance & diagnostic reports | ✅ | en, de, pl, hi |

Each preset has a `voiceNameHints[]` list — `voiceRegistry.findByHints()` picks the first matching voice available on the current device.

---

## Emotion Engine

The emotion engine in `emotion-engine.ts` maps response text (and optional RTC context flags) to a set of TTS parameter multipliers without any ML model.

```mermaid
flowchart LR
  TEXT["Response text"]
  CTX["Context flags\n{ isAlert, isError,\n  isPoorSignal, isRecovery }"]
  DETECT["detectEmotion(text, ctx)\nkeyword regex rules"]
  EMOTION["Emotion\nneutral | calm | alert\nurgent | warm | concerned\nsatisfied | analytical"]
  APPLY["applyEmotion(emotion,\nbase.rate, base.pitch, base.volume)"]
  PARAMS["AppliedVoiceParams\nrate pitch volume\npauseBeforeMs pauseAfterMs"]

  TEXT --> DETECT
  CTX --> DETECT
  DETECT --> EMOTION --> APPLY --> PARAMS
```

Context overrides take priority over text patterns (an `isAlert: true` flag always resolves to `urgent` regardless of text content).

---

## Speech Queue

`speech-queue.ts` replaces direct `window.speechSynthesis.speak()` calls. Every TTS utterance is enqueued as a `SpeechItem` with a priority level.

```mermaid
flowchart TD
  HIGH["HIGH priority\nenqueue(item)\nbarge-in: speechQueue.clear() first"]
  NORMAL["NORMAL priority\ninserted after all HIGH items"]
  LOW["LOW priority\nappended to end (ambient poetry)"]
  QUEUE["Internal queue\n[ HIGH…, NORMAL…, LOW… ]"]
  PROC["_processNext()\napply pauseBeforeMs → speak → pauseAfterMs"]
  ONIDLE["onIdle callback"]

  HIGH --> QUEUE
  NORMAL --> QUEUE
  LOW --> QUEUE
  QUEUE --> PROC --> ONIDLE
```

---

## RTC Context Injection

The hook accepts a live `rtcState` object injected from the RTC store:

```ts
useVoiceLoop({
  connectionState: 'connected',
  iceState: 'completed',
  isRelay: false,
  peers: [{ packetLoss: 0.1, rtt: 22 }],
})
```

`persona.ts` reads this context to generate factual, real-time responses about the current WebRTC session — zero LLM calls, zero latency.

---

## Privacy & Vendor Independence

| Concern | How it's handled |
|---|---|
| STT data | Processed by the **browser's on-device or system ASR** — no cloud upload required |
| TTS voice | Rendered by the **browser's built-in speech synth** — no external TTS API |
| Brain / NLU | Pure **if/regex rule engine** in `persona.ts` — no LLM, no API key |
| Fonts / assets | Self-hosted via `@fontsource` — no Google Fonts CDN |

> The voice pipeline works offline on any device that implements the Web Speech API (Chrome, Edge, Safari 17+).

---

## Call Mode Runtime (New)

**Call Mode** is a higher-level orchestration layer built on top of the voice pipeline. It provides:

### Key Differences from useVoiceLoop

| Feature | useVoiceLoop | Call Mode |
|---------|-------------|-----------|
| **Scope** | Single voice I/O loop | Full session lifecycle |
| **State** | Basic (listening/speaking) | Rich (idle/listening/processing/speaking/error) |
| **Governance** | None | Integration hooks for approval layer |
| **Interruption** | `bargeIn()` simple stop | `interrupt()` with state recovery |
| **Voice Config** | UI-level only | Persistent via localStorage |
| **Output Control** | Direct synthesis | Queued, priority-based playback |

### Architecture

```
Call Mode Controller (src/runtime/CallMode.ts)
├── useCallMode() hook [React]
├── Session management (startSession / stopSession)
├── Input processing (processInput → governance → agent)
├── Voice output (speakResponse → Web Speech API)
└── State machine with error handling

Uses:
├── SpeechRecognition API (input)
├── Web Speech API (output)
├── VoiceStudio config (saved voice preferences)
└── Governance integration hooks
```

### Flow Diagram

```mermaid
graph TD
  A["Call Mode Controller"] -->|startSession| B["Init SpeechRecognition"]
  B -->|onopen| C["listening"]
  C -->|user speech| D["SpeechRecognition onresult"]
  D -->|transcript| E["processInput()"]
  E -->|governance layer| F["Check policy"]
  F -->|approved| G["Agent pipeline"]
  G -->|response text| H["speakResponse()"]
  H -->|to Web Speech| I["TTS with saved config"]
  I -->|onend| C
  C -->|user interrupts| J["interrupt()"]
  J -->|stop TTS| C
```

### See Also

- `docs/integration.md#call-mode-runtime` — Quick start and API reference
- `docs/CALL_MODE_INTEGRATION.md` — Advanced governance and agent integration
- `src/components/CallModeUI.tsx` — React component for UI controls
