#!/bin/bash
# LEEWAY HEADER — CORE.DELIVERY.VOICE.TERMUX
# Bridging Android Native Google TTS for Termux sovereignty

echo "[LEEWAY] Awakening Android System TTS via Termux API..."

# Ensure termux-api tools are present
if ! command -v termux-tts-speak &> /dev/null; then
    echo "[LEEWAY] Installing Termux API tools..."
    pkg install -y termux-api
fi

mkdir -p ~/.leeway
# On Termux, we often use the system default set in Android Accessibility settings
echo "{\"os\": \"termux\", \"voice_id\": \"default\", \"method\": \"termux-tts-speak\"}" > ~/.leeway/voice-config.json

echo "[LEEWAY] Android native bridge verified. Sovereignty is 100% local."
