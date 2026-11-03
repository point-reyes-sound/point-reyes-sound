#!/usr/bin/env python3
"""
concat_executive_and_demo.py

Concatenates:
  1. Executive Film (Part 1, ~0:58): public/point_reyes_sound_complete_film.mp4
     - Introduces Point Reyes Sound, continuous phase-space kinetics, and Q-Boltz solver platform.
  2. Interactive Demo Film (Part 2, ~0:58): public/interface_demo.mp4
     - Demonstrates H2 dissociation in phase space on the Point Reyes Sound UI with the posh British voiceover.

Normalizes:
  - Video: 1920x1080 (1080p 16:9), 60 fps, H.264 High Profile (yuv420p), CRF 22, faststart moov atom.
  - Audio: AAC stereo, 48000 Hz, 256 kbps.
Output:
  - public/composite_demo_film.mp4 (~40 MB, ~1m 55s)
"""

import os
import subprocess
import sys

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(repo_root, "public")
    
    film1 = os.path.join(public_dir, "point_reyes_sound_complete_film.mp4")
    film2 = os.path.join(public_dir, "interface_demo.mp4")
    output = os.path.join(public_dir, "composite_demo_film.mp4")
    
    if not os.path.exists(film1):
        print(f"Error: Film 1 not found at {film1}", file=sys.stderr)
        sys.exit(1)
    if not os.path.exists(film2):
        print(f"Error: Film 2 not found at {film2}", file=sys.stderr)
        sys.exit(1)
        
    print(f"[1/2] Concatenating:\n  1: {film1}\n  2: {film2}\n  -> Output: {output}")
    
    cmd = [
        "ffmpeg", "-y",
        "-i", film1,
        "-i", film2,
        "-filter_complex",
        "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=60,setsar=1,format=yuv420p[v0];"
        "[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=60,setsar=1,format=yuv420p[v1];"
        "[0:a]aformat=sample_rates=48000:channel_layouts=stereo[a0];"
        "[1:a]aformat=sample_rates=48000:channel_layouts=stereo[a1];"
        "[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]",
        "-map", "[v]",
        "-map", "[a]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "256k",
        "-movflags", "+faststart",
        output
    ]
    
    subprocess.run(cmd, check=True)
    
    # Check stats
    size_mb = os.path.getsize(output) / (1024 * 1024)
    print(f"[2/2] Done! Generated composite film: {output} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    main()
