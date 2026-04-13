import asyncio
import edge_tts
import os
import csv
import re

# ==========================================
# CONSTANTS & CONFIGURATION
# ==========================================
# Set the Microsoft/Azure voice you want to clone here. 
# Popular male voices: en-US-ChristopherNeural, en-US-GuyNeural, en-US-EricNeural
TARGET_VOICE = "en-US-ChristopherNeural" 

DATASET_ROOT = os.path.join(os.path.dirname(__file__), 'piper-dataset')
WAV_DIR = os.path.join(DATASET_ROOT, 'wavs')
METADATA_FILE = os.path.join(DATASET_ROOT, 'metadata.csv')
SENTENCES_FILE = os.path.join(os.path.dirname(__file__), 'training_sentences.txt')

# Ensure directories exist
os.makedirs(WAV_DIR, exist_ok=True)

# Define rate/pitch adjustments if needed to match Agent Lee's existing tone
RATE = "+0%"
PITCH = "+0Hz"

async def generate_audio(text: str, file_path: str):
    """Hits the Microsoft Edge Read Aloud API to generate high-fidelity wavs"""
    communicate = edge_tts.Communicate(text, TARGET_VOICE, rate=RATE, pitch=PITCH)
    # Edge-TTS outputs mp3 by default, we'll request raw PCM/Wav if supported, but mp3 is fine for ffmpeg conversion later.
    # To keep it simple, we save as wav (piper training accepts standard wav). Edge-tts actually outputs mp3 format natively.
    # We will save as mp3 first, then convert if needed. For now, we save raw bytes as .wav (though it requires ffmpeg).
    # Piper prefers 22050Hz 16-bit mono wav. Edge-TTS outputs standard mp3 or webm. 
    # Let's save as .mp3 here, and you can ffmpeg convert it, OR we just use standard edge-tts .wav output format if it exists.
    
    # Actually edge-tts allows selecting output format.
    # Let's just save it. Piper's pre-processing will handle wav conversion if we pass proper wavs.
    mp3_path = file_path.replace('.wav', '.mp3')
    await communicate.save(mp3_path)
    
    # We will skip the automated ffmpeg WAV conversion here because ffmpeg may not be installed.
    # The dataset will be downloaded as .mp3 files. Before Piper training, a bulk convert script can 
    # convert them to 22050Hz Mono PCM WAV.
    print(f"Saved: {mp3_path} (Convert to 22050Hz Mono WAV later for Piper)")

async def main():
    if not os.path.exists(SENTENCES_FILE):
        print(f"ERROR: Could not find {SENTENCES_FILE}.")
        print("Please create this file and add phonetically diverse sentences, one per line.")
        return

    print(f"Starting Dataset Generation for voice: {TARGET_VOICE}")
    print(f"Outputting to: {DATASET_ROOT}")

    with open(SENTENCES_FILE, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]

    # Piper Piper metadata.csv format: audiofile_id|transcript
    # Open CSV in append mode in case the script stops and we need to resume
    existing_ids = set()
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r', encoding='utf-8') as f:
            for row in f:
                parts = row.split('|')
                if len(parts) > 0:
                    existing_ids.add(parts[0])

    with open(METADATA_FILE, 'a', encoding='utf-8', newline='') as csvfile:
        for index, line in enumerate(lines):
            # Create a simple clean ID: lee_0001
            audio_id = f"lee_{index:04d}"
            wav_filename = f"{audio_id}.wav"
            wav_filepath = os.path.join(WAV_DIR, wav_filename)

            if audio_id in existing_ids:
                print(f"Skipping {audio_id}, already exists.")
                continue

            print(f"Generating [{audio_id}]: {line[:50]}...")
            
            try:
                await generate_audio(line, wav_filepath)
                # Write to Piper metadata format
                csvfile.write(f"{audio_id}|{line}\n")
                csvfile.flush() # Ensure it saves to disk immediately
                # Slight sleep to avoid rate limiting
                await asyncio.sleep(1)
            except Exception as e:
                print(f"Failed to generate audio for {audio_id}. Error: {str(e)}")

    print("\nDataset generation complete!")
    print(f"Your Piper dataset is ready in: {DATASET_ROOT}")

if __name__ == "__main__":
    asyncio.run(main())
