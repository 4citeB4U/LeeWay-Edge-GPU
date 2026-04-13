#!/bin/bash
# LEEWAY HEADER — CORE.DELIVERY.VOICE.MACOS
# Autoconfigures high-fidelity Siri/Natural voices for macOS

echo "[LEEWAY] Scanning macOS for High-Fidelity Apple Voices..."

# List all available high-quality voices
# User can download more via System Preferences: Accessibility > Spoken Content > System Voice
AVAILABLE_EN=$(say -v ? | grep "en_")
echo "Available High-Quality English Voices:"
echo "$AVAILABLE_EN"

# Priority for Apple Natural Voices
PREFERRED_VOICES=("Ava" "Samantha" "Daniel" "Alex")
SELECTED_VOICE=""

for voice in "${PREFERRED_VOICES[@]}"; do
    if say -v '?' | grep -q "$voice"; then
        SELECTED_VOICE="$voice"
        break
    fi
done

if [ -z "$SELECTED_VOICE" ]; then
    echo "[LEEWAY] No high-fidelity voices found. Defaulting to Samantha."
    SELECTED_VOICE="Samantha"
fi

mkdir -p ~/.leeway
echo "{\"os\": \"darwin\", \"voice_id\": \"$SELECTED_VOICE\", \"method\": \"say\"}" > ~/.leeway/voice-config.json

echo "[LEEWAY] macOS native voice locked: $SELECTED_VOICE"
echo "TIP: To download more fidelity-grade voices, go to System Settings > Accessibility > Spoken Content."
