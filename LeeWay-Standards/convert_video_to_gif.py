/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.CONVERT_VIDEO_TO_GIF.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = convert_video_to_gif module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = convert_video_to_gif.py
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
"""
MP4 to GIF Converter for GitHub README
Converts your shortened MP4 video to an animated GIF for inline display
"""

import os
import sys

def convert_mp4_to_gif():
    """Convert MP4 video to animated GIF"""
    
    input_file = r'e:\LeeWay-Standards-main\public\readmevideo.mp4'
    gif_file = r'e:\LeeWay-Standards-main\public\readmevideo.gif'
    
    # Check if video file exists and is valid
    if not os.path.exists(input_file):
        print("ERROR: Video file not found at:", input_file)
        return False
    
    file_size = os.path.getsize(input_file) / (1024 * 1024)
    if file_size == 0:
        print("ERROR: Video file is empty (0 MB)")
        print("Please re-export your shortened video from your video editor")
        print("Make sure the export completes fully without interruption")
        return False
    
    print(f"Video file: {input_file}")
    print(f"File size: {file_size:.2f} MB")
    print("\nConverting MP4 to GIF...")
    
    try:
        import cv2
        import imageio
        
        # Open video with OpenCV
        cap = cv2.VideoCapture(input_file)
        frames = []
        count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(frame_rgb)
            count += 1
            if count % 30 == 0:
                print(f"  Processed {count} frames...")
        
        cap.release()
        
        if len(frames) == 0:
            print("ERROR: Could not read frames from video")
            return False
        
        print(f"Total frames: {len(frames)}")
        print("Saving as GIF...")
        
        imageio.mimsave(gif_file, frames, fps=10, loop=0)
        
        gif_size = os.path.getsize(gif_file) / (1024 * 1024)
        print(f"SUCCESS! GIF created ({gif_size:.2f} MB)")
        print(f"Output: {gif_file}")
        
        return True
        
    except ImportError as e:
        print(f"ERROR: Missing dependencies: {e}")
        print("Install with: pip install opencv-python imageio")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == '__main__':
    success = convert_mp4_to_gif()
    sys.exit(0 if success else 1)
