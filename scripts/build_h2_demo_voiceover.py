"""
scripts/build_h2_demo_voiceover.py
Master 30-Second Voiceover Generator for H2 Phase-Space Dissociation Demo.
Matches the exact aesthetic of the a16z deck video voiceovers:
- Voice: en-US-AndrewMultilingualNeural
- Rate/Volume: Crisp executive pitch delivery with natural atempo filter
- 48 kHz stereo master
- High-tech glass pulse clicks at visual transition moments
- 432Hz ethereal ambient harmonic drone with shimmer chorus
- Dynamic ducking under speech envelope
- Exact 30.00-second timeline (0:00 to 0:30) with musical resolution tail
"""

import os
import sys
import time
import subprocess
from pathlib import Path
import numpy as np
import scipy.io.wavfile as wav

sr = 48000
total_duration = 30.0
total_samples = int(total_duration * sr)

edge_tts_bin = "/opt/homebrew/Caskroom/miniforge/base/bin/edge-tts"
if not os.path.exists(edge_tts_bin):
    edge_tts_bin = "edge-tts"

scratch_dir = Path("/tmp/h2_voiceover_build")
scratch_dir.mkdir(parents=True, exist_ok=True)

phrases = [
    # P1: Prompt / Phase Space Inquiry (0.40s -> ~5.8s)
    ("p1", "Conceptualize and envision the dissociation of molecular hydrogen in phase space."),
    # P2: Active Space Natural Orbitals (6.30s -> ~14.3s)
    ("p2", "As the bond stretches, Q-Boltz computes active space orbitals across the top panels, tracking the sigma-g and sigma-u lobes."),
    # P3: Coulson-Fischer Topology & Wigner Transport (14.80s -> ~22.3s)
    ("p3", "At the Coulson-Fischer singularity, our patented solver regularizes topological breakdown with continuous Wigner transport."),
    # P4: Exact Radical Dissociation & Accuracy (22.80s -> ~28.7s)
    ("p4", "This achieves exact radical dissociation, delivering chemical accuracy in seconds.")
]

def synth_phrase(name, text):
    mp3_raw = scratch_dir / f"{name}_raw.mp3"
    wav_tempo = scratch_dir / f"{name}_tempo.wav"
    
    # If raw mp3 already exists and is non-empty, reuse it; otherwise synthesize with retry
    if not (mp3_raw.exists() and mp3_raw.stat().st_size > 1000):
        for attempt in range(6):
            try:
                cmd = [
                    edge_tts_bin,
                    "--voice", "en-US-AndrewMultilingualNeural",
                    "--rate=-2%",
                    "--volume=+2%",
                    "--text", text,
                    "--write-media", str(mp3_raw)
                ]
                res = subprocess.run(cmd, capture_output=True, text=True)
                if res.returncode == 0 and mp3_raw.exists() and mp3_raw.stat().st_size > 1000:
                    break
                print(f"[*] Retry {name} (attempt {attempt+1}): {res.stderr.strip()[:80]}")
            except Exception as e:
                print(f"[*] Exception {name} (attempt {attempt+1}): {e}")
            time.sleep(1.5)
            
    # Apply crisp 1.16x tempo filter (preserving pitch) and resample to 48kHz stereo WAV
    cmd_wav = f'ffmpeg -y -i "{mp3_raw}" -filter:a "atempo=1.16" -ar {sr} -ac 2 "{wav_tempo}"'
    subprocess.run(cmd_wav, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    rate, data = wav.read(wav_tempo)
    if data.ndim == 1:
        data = np.column_stack([data, data])
    dur = len(data) / sr
    return data, dur

print("[*] Preparing 30.0-second speech phrases with Andrew Multilingual Neural...")
audio_data = []
for name, text in phrases:
    d, dur = synth_phrase(name, text)
    print(f"    - {name} ({dur:.2f}s): {text[:65]}...")
    audio_data.append((name, d, dur))

# Pacing & Timeline Schedule to fit inside 30.0s
p1_dur = audio_data[0][2]
p2_dur = audio_data[1][2]
p3_dur = audio_data[2][2]
p4_dur = audio_data[3][2]

t_p1 = 0.40
t_p2 = t_p1 + p1_dur + 0.45
t_p3 = t_p2 + p2_dur + 0.45
t_p4 = t_p3 + p3_dur + 0.45

timeline = [
    ("p1", t_p1, audio_data[0][1]),
    ("p2", t_p2, audio_data[1][1]),
    ("p3", t_p3, audio_data[2][1]),
    ("p4", t_p4, audio_data[3][1]),
]

print("\n[*] Synchronized Timeline:")
for name, start, data in timeline:
    dur = len(data) / sr
    print(f"    {name}: {start:5.2f}s -> {start+dur:5.2f}s  (dur: {dur:.2f}s)")
speech_end = t_p4 + p4_dur
print(f"    Speech Ends: {speech_end:.2f}s | Ambient Outro: {total_duration - speech_end:.2f}s | Total Timeline: {total_duration:.2f}s")

master_voice = np.zeros((total_samples, 2), dtype=np.float32)

for name, start_sec, data in timeline:
    s_idx = int(start_sec * sr)
    e_idx = s_idx + len(data)
    if e_idx > total_samples:
        data = data[:total_samples - s_idx]
        e_idx = total_samples
    norm = data.astype(np.float32) / 32768.0
    master_voice[s_idx:e_idx] += norm

# High-tech glass pulse clicks at visual transition moments (identical to deck audio)
def make_click():
    clk_len = int(0.06 * sr)
    t = np.linspace(0, 0.06, clk_len, endpoint=False)
    clk = np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 90) + np.sin(2 * np.pi * 5200 * t) * 0.45 * np.exp(-t * 120)
    return np.column_stack([clk * 0.28, clk * 0.28]).astype(np.float32)

click_sound = make_click()
click_times = [
    t_p2 - 0.12,  # 1. Orbital panels revelation
    t_p3 - 0.12,  # 2. Coulson-Fischer bifurcation & Wigner display
    t_p4 - 0.12,  # 3. Dissociation convergence lock
    28.60         # 4. Final resolution chime
]

for ct in click_times:
    c_idx = int(ct * sr)
    if c_idx + len(click_sound) <= total_samples:
        master_voice[c_idx:c_idx + len(click_sound)] += click_sound

# Ambient 432Hz harmonic bed (identical score profile to deck video descriptions)
t_full = np.linspace(0, total_duration, total_samples, endpoint=False)
pad = (
    np.sin(2 * np.pi * 108 * t_full) * 0.040 +
    np.sin(2 * np.pi * 216 * t_full) * 0.026 +
    np.sin(2 * np.pi * 324 * t_full) * 0.015 +
    np.sin(2 * np.pi * 432 * t_full) * 0.011 +
    np.sin(2 * np.pi * 648 * t_full) * 0.007
)
shimmer = np.sin(2 * np.pi * 1296 * t_full + np.sin(2 * np.pi * 0.25 * t_full) * 2.0) * 0.0055

# Fade in and fade out envelope
fade_in_len = int(1.2 * sr)
fade_out_len = int(2.4 * sr)
env = np.ones(total_samples, dtype=np.float32)
env[:fade_in_len] = np.linspace(0, 1, fade_in_len)
env[-fade_out_len:] = np.linspace(1, 0, fade_out_len)

music = np.column_stack([(pad + shimmer) * env, (pad + np.roll(shimmer, 2400)) * env]).astype(np.float32)

# Dynamic ducking under voice envelope
voice_envelope = np.abs(master_voice[:, 0]) + np.abs(master_voice[:, 1])
kernel_size = int(0.35 * sr)
kernel = np.ones(kernel_size) / kernel_size
duck_env = np.convolve(voice_envelope, kernel, mode='same')
duck_factor = 1.0 - np.clip(duck_env * 3.4, 0.0, 0.70)
music = music * duck_factor[:, None]

# Master mix
mix = master_voice * 0.88 + music * 0.62
max_val = np.max(np.abs(mix))
if max_val > 0.95:
    mix = mix / max_val * 0.95

mix_int16 = (mix * 32767).astype(np.int16)

# Output paths
out_dir = Path("/Users/romitchakraborty/QAI/point-reyes-sound/public/audio")
out_dir.mkdir(parents=True, exist_ok=True)
master_wav = out_dir / "h2_demo_30s_voiceover.wav"
master_mp3 = out_dir / "h2_demo_30s_voiceover.mp3"
active_mp3 = out_dir / "h2_phase_space_voiceover.mp3"

wav.write(str(master_wav), sr, mix_int16)

# Encode to 320k MP3
subprocess.run(f"ffmpeg -y -i {master_wav} -b:a 320k {master_mp3}", shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
# Also copy to active voiceover path
subprocess.run(f"cp {master_mp3} {active_mp3}", shell=True, check=True)

# Also copy to conversation artifact directory
brain_dir = Path("/Users/romitchakraborty/.gemini/antigravity-ide/brain/e0965ef3-f5af-49e6-9f8f-8b3ff916b8f1")
if brain_dir.exists():
    subprocess.run(f"cp {master_mp3} {brain_dir}/h2_demo_30s_voiceover.mp3", shell=True)

print(f"\n[✓] Successfully generated 30.00s master voiceover:")
print(f"    - WAV: {master_wav}")
print(f"    - MP3: {master_mp3}")
print(f"    - Active UI audio: {active_mp3}")
print(f"    - Duration: exactly {total_duration:.2f} seconds.")
