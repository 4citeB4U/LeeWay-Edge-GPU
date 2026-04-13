/*
LEEWAY HEADER — DO NOT REMOVE

TAG: CALL.MODE.INTEGRATION.GUIDE
REGION: 🔵 RUNTIME
PURPOSE: Integration guide for Call Mode with existing agent pipeline and governance
LICENSE: PROPRIETARY
*/

# Call Mode Integration Guide

## Architecture Overview

Call Mode is a runtime orchestration layer that sits ABOVE the existing voice system. It manages:

- **Session Management**: Start/stop call sessions
- **Microphone Input**: Capture and buffer user speech
- **Speech Detection**: Detect speech start/end and silence
- **Turn-Taking**: Pause listening during processing/speaking
- **Governance Integration**: Route responses through existing approval system
- **Voice Output**: Play approved responses using saved VoiceStudio config

## Key Design Principles

1. **No Duplication**: Call Mode reuses VoiceStudio's saved voice configuration instead of managing its own
2. **Single Authority**: Governance approval happens in ONE place (not replicated)
3. **Clean Separation**: VoiceStudio remains a configuration/preview tool; Call Mode is the conversation runtime
4. **Non-Invasive**: Call Mode is layered on top; existing systems are untouched

## Module Structure

```
src/
├── voice/
│   ├── voice-config.ts           # Persist user voice preferences to localStorage
│   ├── voice-output.ts           # Speak utterances with saved config
│   ├── VoiceStudio.tsx           # (Updated) Now persists config when user selects
│   └── ... (existing voice modules)
├── runtime/
│   ├── CallMode.ts               # Main controller + state + hooks
│   └── index.ts                  # Exports
├── components/
│   ├── CallModeUI.tsx            # Real-time call UI (start/stop, mute, interrupt)
│   └── ... (existing components)
└── sdk/
    └── index.ts                  # (Updated) Exports Call Mode to SDK
```

## Usage Guide

### 1. Initialize Call Mode (App Startup)

```typescript
import { callModeController } from '@leeway/sdk';

// At app startup
callModeController.init();
```

### 2. Start a Call Session

```typescript
import { CallModeUI } from '@leeway/sdk';

export function MyApp() {
  return <CallModeUI />;
}
```

Or programmatically:

```typescript
callModeController.startSession();
```

### 3. Subscribe to State Changes

```typescript
import { useCallModeState, type CallModeSessionState } from '@leeway/sdk';

function MyComponent() {
  const state = useCallModeState();
  
  // state.phase: 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  // state.active: boolean
  // state.micOpen: boolean
  // state.transcript: string
  
  return <div>Phase: {state.phase}</div>;
}
```

### 4. Integrate with Agent Pipeline

When user speech is captured and processed, Call Mode will call your handler:

**In CallMode.ts (src/runtime/CallMode.ts), modify the `processInput()` method:**

```typescript
async processInput(input: string): Promise<void> {
  if (!input || !this.state.active) return;

  this.pauseListening();
  this.setState({ phase: 'processing', isProcessing: true });

  try {
    // INTEGRATION POINT 1: Hand off to agent pipeline
    const response = await agentPipeline.process({
      userInput: input,
      runtimeMode: currentRuntimeMode,
      rtcContext: currentRTCState,
      // ... other context
    });

    // INTEGRATION POINT 2: Route through governance approval
    const approved = await governanceLayer.evaluateResponse(response);

    if (approved.allowed) {
      // Speak the approved response
      this.speakResponse(approved.text);
    } else {
      console.warn('Response blocked by governance:', approved.reason);
      this.speakResponse('I cannot respond to that request.');
    }

    // Resume listening if still active
    if (this.state.active) {
      this.resumeListening();
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    this.setState({ lastError: errorMsg, phase: 'error' });
  }
}
```

### 5. Handle Response with Voice

After governance approval, speak the response:

```typescript
// Automatic (via processInput completion)
// - Or manual call:

callModeController.speakResponse('Hello, how can I help?');
```

### 6. Interrupt Handling

When the user interrupts agent speech:

```typescript
// Automatic via CallModeUI "Interrupt" button
// - Or manual:

callModeController.interrupt();
// This cancels speech and resumes listening
```

## Voice Configuration

Call Mode automatically reuses the voice saved in VoiceStudio:

```typescript
import { loadVoiceConfig, updateVoiceConfig, type VoiceConfig } from '@leeway/sdk';

// Load saved config
const config = loadVoiceConfig();
// {
//   voiceName: 'Microsoft Guy Online (Natural)',
//   rate: 1.0,
//   pitch: 1.0,
//   volume: 1.0
// }

// Update config programmatically
updateVoiceConfig({
  voiceName: 'Some Other Voice',
  rate: 1.2,
});

// Speak with saved config
import { speakWithSavedVoice } from '@leeway/sdk';
speakWithSavedVoice('Hello world', 'normal');
```

## State Machine

```
idle
  ↓ startSession()
listening
  ↓ user speech detected + silence threshold
processing
  ↓ agentPipeline.process() + governanceLayer.evaluateResponse()
speaking
  ↓ response utterance completes
listening
  ↓ (repeat) or stopSession()
idle
```

### Error State

From any state:

```
↓ error (mic denied, speech recognition error, etc.)
↓ lastError populated
↓ can retry startSession()
```

## Interrupt Sequence

When user starts talking while agent is speaking:

```
speaking (agent is mid-utterance)
  ↓ speechRecognition.onresult fires
  ↓ callModeController.interrupt()
    - Cancels speechSynthesis
    - Sets interrupted = true
    - Pauses 500ms
    - Resumes listening
listening
```

## Integration Checklist

- [ ] Import CallModeUI or create control surface
- [ ] Call `callModeController.init()` at app startup
- [ ] Subscribe to state with `useCallModeState()` (optional)
- [ ] Implement agent pipeline integration in `CallMode.ts:processInput()`
- [ ] Integrate governance layer approval in `CallMode.ts:processInput()`
- [ ] Test microphone permissions/access
- [ ] Test silence detection thresholds (currently 1500ms)
- [ ] Test interrupt behavior (cancel + resume)
- [ ] Verify saved voice config is reused from VoiceStudio

## Common Issues

### "Speech Recognition not supported"
- Some browsers (especially Safari) have limited support
- Recommend feature detection and graceful fallback

### Microphone access denied
- Browser permission remains denied until user resets it
- Call mode UI will show clear error message in `state.lastError`

### Silence threshold too short/long
- Edit `silenceThresholdMs` in `CallMode.ts` (current: 1500ms)
- Longer = more patient, shorter = faster response

### Voice config not persisting
- Ensure user reaches "ready" phase in VoiceStudio
- Check browser localStorage is enabled
- Key is "leeway_voice_custom"

## Future Extensions

- [ ] Speaker recognition (identify user by voice before processing)
- [ ] Emotion detection from speech tone
- [ ] Multi-turn conversation memory
- [ ] Call recording and transcription
- [ ] Integration with RTC media stream for server-side TTS
- [ ] Barge-in budget enforcement during speaking
- [ ] Custom silence detection algorithm

## Testing

```typescript
// Manual test in browser console:
import { callModeController } from '@leeway/sdk';

// Start session
callModeController.init();
callModeController.startSession();

// Simulate input
callModeController.processInput('Hello agent');

// Simulate response
callModeController.speakResponse('Hello, I am the agent');

// Stop session
callModeController.stopSession();
```
