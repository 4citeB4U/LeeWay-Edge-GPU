# Voice Pipeline & Local Model Integration

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

## Voice Modes

| Mode           | Constant              | Behaviour                                              |
|----------------|----------------------|--------------------------------------------------------|
| RTC Operations | VOICE_MODES.RTC_OPS  | Responds to WebRTC status queries (peers, ICE, relay)  |
| Ambient        | VOICE_MODES.AMBIENT  | Narrates system state poetically at low cadence        |
| Silent         | VOICE_MODES.SILENT   | STT still runs, but TTS output is suppressed           |
