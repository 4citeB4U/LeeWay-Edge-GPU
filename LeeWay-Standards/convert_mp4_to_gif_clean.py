/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONVERT_MP4_TO_GIF_CLEAN.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = convert_mp4_to_gif_clean module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = convert_mp4_to_gif_clean.py
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

#!/usr/bin/env python
"""Convert MP4 to GIF for GitHub README"""
import sys
import os
import subprocess

input_file = r'e:\LeeWay-Standards-main\public\readmevideo.mp4'
gif_file = r'e:\LeeWay-Standards-main\public\readmevideo.gif'

print("Converting MP4 to GIF...")
print(f"Input: {input_file}")
print(f"Output: {gif_file}")

# Check if video exists
if not os.path.exists(input_file):
    print("ERROR: Video file not found!")
    sys.exit(1)

size = os.path.getsize(input_file) / (1024 * 1024)
print(f"File size: {size:.2f} MB\n")

try:
    import imageio
    import numpy as np
    from PIL import Image
    
    print("Reading video frames...")
    reader = imageio.get_reader(input_file)
    
    frames = []
    for i, frame in enumerate(reader):
        frames.append(frame)
        if (i + 1) % 50 == 0:
            print(f"  {i + 1} frames processed...")
    
    print(f"Total frames: {len(frames)}")
    
    if len(frames) > 0:
        print("Creating GIF...")
        imageio.mimwrite(gif_file, frames, fps=10, loop=0)
        
        gif_size = os.path.getsize(gif_file) / (1024 * 1024)
        print(f"\nSUCCESS! GIF created: {gif_size:.2f} MB")
        print(f"Ready to add to GitHub markdown!")
    else:
        print("ERROR: No frames extracted!")
        sys.exit(1)
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
