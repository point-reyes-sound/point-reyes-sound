"""
scripts/build_posh_interface_voiceover.py
Generates an exquisitely posh, refined British alternative voiceover for public/interface_audio.m4a.
- Voice: en-GB-RyanNeural (Oxbridge / Aristocratic RP diction)
- Pacing: Close to 1 minute (~58.5 seconds)
- Audio Engineering: 48 kHz stereo master, 432Hz harmonic bed, subtle shimmer chorus, glass pulse chimes, dynamic ducking.
- Target Output: public/audio/posh_interface_voiceover.mp3 and public/interface_audio_posh.mp3
"""

import os
import sys
import time
import subprocess
from pathlib import Path
import numpy as np
import scipy.io.wavfile as wav

sr = 48000
total_duration = 58.50
total_samples = int(total_duration * sr)

edge_tts_bin = "/opt/homebrew/Caskroom/miniforge/base/bin/edge-tts"
if not os.path.exists(edge_tts_bin):
    edge_tts_bin = "edge-tts"

scratch_dir = Path("/tmp/posh_voiceover_build")
scratch_dir.mkdir(parents=True, exist_ok=True)

# Elevated posh script expanding upon user's recording in interface_audio.m4a
phrases = [
    # P1: Agentic interaction & orchestration
    ("p1", "Our interface is entirely agentic. A researcher simply presents the system with an ambitious inquiry, and our orchestration engine instantly springs to life."),
    # P2: Active space construction & physical features
    ("p2", "It automatically constructs the active space corresponding to the physical manifold under study, providing an exquisitely thorough elucidation of the underlying quantum mechanical topology."),
    # P3: Regularizing topological singularities
    ("p3", "By regularizing non-equilibrium singularities with our patented quantum algorithms, we accomplish far more than merely advancing fundamental theoretical physics."),
    # P4: Strong correlation at low cost & expanded discovery
    ("p4", "We resolve strongly correlated electronic structures at an unprecedented fraction of conventional computational cost, unlocking a vastly expanded horizon of molecular discovery targets."),
    # P5: Brand sign-off
    ("p5", "This is Point Reyes Sound, redefining computational chemistry from first principles.")
]

def synth_phrase(name, text, voice="en-GB-RyanNeural"):
    mp3_path = scratch_dir / f"{name}_{voice}.mp3"
    wav_path = scratch_dir / f"{name}_{voice}.wav"
    
    if not (mp3_path.exists() and mp3_path.stat().st_size > 1000):
        for attempt in range(6):
            try:
                cmd = [
                    edge_tts_bin,
                    "--voice", voice,
                    "--rate=-2%",
                    "--volume=+2%",
                    "--text", text,
                    "--write-media", str(mp3_path)
                ]
                res = subprocess.run(cmd, capture_output=True, text=True)
                if res.returncode == 0 and mp3_path.exists() and mp3_path.stat().st_size > 1000:
                    break
                print(f"[*] Retry {name} (attempt {attempt+1}): {res.stderr.strip()[:80]}")
            except Exception as e:
                print(f"[*] Exception {name} (attempt {attempt+1}): {e}")
            time.sleep(1.5)
            
    # Resample to 48kHz stereo WAV
    cmd_wav = f'ffmpeg -y -i "{mp3_path}" -ar {sr} -ac 2 "{wav_path}"'
    subprocess.run(cmd_wav, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    rate, data = wav.read(wav_path)
    if data.ndim == 1:
        data = np.column_stack([data, data])
    dur = len(data) / sr
    return data, dur

print("[*] Synthesizing posh British narration with en-GB-RyanNeural...")
audio_data = []
for name, text in phrases:
    d, dur = synth_phrase(name, text)
    print(f"    - {name} ({dur:.2f}s): {text[:65]}...")
    audio_data.append((name, d, dur))

# Pacing & Timeline Schedule to span ~58.5 seconds (close to 1 minute)
p1_dur = audio_data[0][2]
p2_dur = audio_data[1][2]
p3_dur = audio_data[2][2]
p4_dur = audio_data[3][2]
p5_dur = audio_data[4][2]

t_p1 = 0.80
t_p2 = t_p1 + p1_dur + 0.90
t_p3 = t_p2 + p2_dur + 0.90
t_p4 = t_p3 + p3_dur + 0.90
t_p5 = t_p4 + p4_dur + 0.90

timeline = [
    ("p1", t_p1, audio_data[0][1]),
    ("p2", t_p2, audio_data[1][1]),
    ("p3", t_p3, audio_data[2][1]),
    ("p4", t_p4, audio_data[3][1]),
    ("p5", t_p5, audio_data[4][1]),
]

print("\n[*] Posh Voiceover Timeline:")
for name, start, data in timeline:
    dur = len(data) / sr
    print(f"    {name}: {start:5.2f}s -> {start+dur:5.2f}s  (dur: {dur:.2f}s)")
speech_end = t_p5 + p5_dur
print(f"    Speech Ends: {speech_end:.2f}s | Ambient Outro: {total_duration - speech_end:.2f}s | Total Duration: {total_duration:.2f}s (~1 minute)")

master_voice = np.zeros((total_samples, 2), dtype=np.float32)

for name, start_sec, data in timeline:
    s_idx = int(start_sec * sr)
    e_idx = s_idx + len(data)
    if e_idx > total_samples:
        data = data[:total_samples - s_idx]
        e_idx = total_samples
    norm = data.astype(np.float32) / 32768.0
    master_voice[s_idx:e_idx] += norm

# High-tech glass pulse clicks at revelation moments
def make_click():
    clk_len = int(0.06 * sr)
    t = np.linspace(0, 0.06, clk_len, endpoint=False)
    clk = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90) + np.sin(2 * np.pi * 4800 * t) * 0.45 * np.exp(-t * 120)
    return np.column_stack([clk * 0.25, clk * 0.25]).astype(np.float32)

click_sound = make_click()
click_times = [
    t_p2 - 0.15,
    t_p3 - 0.15,
    t_p4 - 0.15,
    t_p5 - 0.15,
    speech_end + 0.50
]

for ct in click_times:
    c_idx = int(ct * sr)
    if c_idx + len(click_sound) <= total_samples:
        master_voice[c_idx:c_idx + len(click_sound)] += click_sound

# Ambient 432Hz harmonic bed
t_full = np.linspace(0, total_duration, total_samples, endpoint=False)
pad = (
    np.sin(2 * np.pi * 108 * t_full) * 0.038 +
    np.sin(2 * np.pi * 216 * t_full) * 0.024 +
    np.sin(2 * np.pi * 324 * t_full) * 0.014 +
    np.sin(2 * np.pi * 432 * t_full) * 0.010 +
    np.sin(2 * np.pi * 648 * t_full) * 0.007
)
shimmer = np.sin(2 * np.pi * 1296 * t_full + np.sin(2 * np.pi * 0.25 * t_full) * 2.0) * 0.005

fade_in_len = int(1.8 * sr)
fade_out_len = int(3.2 * sr)
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
mix = master_voice * 0.88 + music * 0.60
max_val = np.max(np.abs(mix))
if max_val > 0.95:
    mix = mix / max_val * 0.95

mix_int16 = (mix * 32767).astype(np.int16)

# Output paths
out_dir = Path("/Users/romitchakraborty/QAI/point-reyes-sound/public/audio")
out_dir.mkdir(parents=True, exist_ok=True)
master_wav = out_dir / "posh_interface_voiceover.wav"
master_mp3 = out_dir / "posh_interface_voiceover.mp3"
direct_mp3 = Path("/Users/romitchakraborty/QAI/point-reyes-sound/public/interface_audio_posh.mp3")
direct_m4a = Path("/Users/romitchakraborty/QAI/point-reyes-sound/public/interface_audio_posh.m4a")

wav.write(str(master_wav), sr, mix_int16)

# Encode to 320k MP3
subprocess.run(f"ffmpeg -y -i {master_wav} -b:a 320k {master_mp3}", shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
subprocess.run(f"cp {master_mp3} {direct_mp3}", shell=True, check=True)

# Encode to AAC M4A matching user's original container
subprocess.run(f"ffmpeg -y -i {master_wav} -c:a aac -b:a 256k {direct_m4a}", shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# Copy to conversation artifacts
brain_dir = Path("/Users/romitchakraborty/.gemini/antigravity-ide/brain/e0965ef3-f5af-49e6-9f8f-8b3ff916b8f1")
if brain_dir.exists():
    subprocess.run(f"cp {master_mp3} {brain_dir}/posh_interface_voiceover.mp3", shell=True)
    subprocess.run(f"cp {direct_m4a} {brain_dir}/interface_audio_posh.m4a", shell=True)

print(f"\n[✓] Successfully generated posh British voiceover (~1 minute):")
print(f"    - WAV: {master_wav}")
print(f"    - MP3: {master_mp3}")
print(f"    - Direct M4A: {direct_m4a}")
print(f"    - Duration: {total_duration:.2f} seconds")
