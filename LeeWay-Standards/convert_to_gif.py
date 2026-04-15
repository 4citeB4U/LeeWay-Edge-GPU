/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONVERT_TO_GIF.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = convert_to_gif module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = convert_to_gif.py
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

#!/usr/bin/env python3
"""Convert MP4 to animated GIF for GitHub README display."""

import imageio
import os

input_file = r'e:\LeeWay-Standards-main\public\readmevideo.mp4'
output_file = r'e:\LeeWay-Standards-main\public\readmevideo.gif'

print("Converting MP4 to GIF...")
print(f"Input: {input_file}")
print(f"Output: {output_file}")

try:
    reader = imageio.get_reader(input_file)
    imageio.mimsave(output_file, reader, fps=10)
    
    size = os.path.getsize(output_file) / (1024 * 1024)
    print(f"✓ GIF created successfully! ({size:.2f} MB)")
except Exception as e:
    print(f"✗ Error: {e}")
