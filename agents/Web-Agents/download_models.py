/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.DOWNLOAD_MODELS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = download_models module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = agents\Web-Agents\download_models.py
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

"""
download_models.py

This helper script illustrates how you can programmatically download
the Phi‑3 Mini small language model and export the YOLOv8n object
detection model to ONNX for offline use.  Run this script on a
machine with internet access and sufficient disk space.  It uses the
`huggingface_hub` library to fetch models from Hugging Face and the
`ultralytics` package to export YOLOv8n.

Usage:

    python download_models.py --phi-out /path/to/phi-3-mini-int4 \
                             --yolo-out /path/to/yolov8n-int8.onnx

Dependencies:

    pip install huggingface_hub ultralytics onnx

Note: You may need a Hugging Face token to download some models.
"""

import argparse
import os
import subprocess
from huggingface_hub import snapshot_download


def download_phi3_mini(output_dir: str, revision: str = "phi-3-mini-128k-instruct"):
    """Download the Phi‑3 Mini model repository from Hugging Face.

    The repository contains configuration, tokenizer and weight files.
    This script downloads the entire repository into `output_dir`.

    Args:
        output_dir: Directory where the model will be downloaded.
        revision: Optional specific revision tag (default is the
            instruct variant).  See https://huggingface.co/microsoft
            for available revisions.
    """
    print(f"Downloading Phi‑3 Mini to {output_dir}...")
    snapshot_download(
        repo_id="microsoft/phi-3-mini",
        revision=revision,
        local_dir=output_dir,
        local_dir_use_symlinks=False,
    )
    print("Phi‑3 Mini download complete.")


def export_yolov8n(output_path: str):
    """Export YOLOv8n to ONNX format using ultralytics.

    This function installs the ultralytics package (if needed) and
    invokes the export command to produce an ONNX file at
    `output_path`.  The exported model uses default weights.  For
    quantised int8 exports you may need additional tooling from
    onnxruntime or the neural compressor.
    """
    try:
        import ultralytics  # type: ignore
    except ImportError:
        print("Installing ultralytics package…")
        subprocess.check_call(["pip", "install", "ultralytics"])
    from ultralytics import YOLO  # type: ignore

    print("Exporting YOLOv8n to ONNX…")
    model = YOLO("yolov8n.pt")
    model.export(format="onnx", file=output_path)
    print(f"YOLOv8n exported to {output_path}.")


def main():
    parser = argparse.ArgumentParser(description="Download Phi‑3 Mini and YOLOv8n models.")
    parser.add_argument("--phi-out", type=str, required=True, help="Directory for Phi‑3 Mini model files")
    parser.add_argument("--yolo-out", type=str, required=True, help="Output path for YOLOv8n ONNX model")
    parser.add_argument("--phi-revision", type=str, default="phi-3-mini-128k-instruct", help="Phi‑3 revision to download")
    args = parser.parse_args()

    os.makedirs(args.phi_out, exist_ok=True)
    download_phi3_mini(args.phi_out, args.phi_revision)
    export_yolov8n(args.yolo_out)


if __name__ == "__main__":
    main()