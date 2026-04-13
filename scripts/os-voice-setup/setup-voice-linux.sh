#!/bin/bash
# LEEWAY HEADER — CORE.DELIVERY.VOICE.LINUX
# Autoconfigures speech-dispatcher and mbrola for high-quality Linux TTS

echo "[LEEWAY] Configuring Linux Native Sovereign Voice..."

# Install the speech infrastructure
if command -v apt-get &> /dev/null; then
    sudo apt update && sudo apt install -y speech-dispatcher speech-dispatcher-espeak-ng mbrola mbrola-en1
fi

# Determine if we should use spd-say (preferred) or espeak (fallback)
METHOD="spd-say"
VOICE="female1" # High quality American English profile

if ! command -v spd-say &> /dev/null; then
    METHOD="espeak"
    VOICE="en-us+m1"
fi

mkdir -p ~/.leeway
echo "{\"os\": \"linux\", \"voice_id\": \"$VOICE\", \"method\": \"$METHOD\"}" > ~/.leeway/voice-config.json

echo "[LEEWAY] Linux local voice channel established via $METHOD ($VOICE)."
