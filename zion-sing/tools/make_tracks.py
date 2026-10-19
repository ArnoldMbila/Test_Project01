"""Writes the two playback tracks per song and tools/transcripts/meta.json.

  instrumental = original mix − separated vocals   (audio/<id>_inst.mp3)
  vocals       = separated vocal stem              (audio/<id>_vocals.mp3, the "guide vocal")

Usage: python tools/make_tracks.py <id> <original.mp3> <vocals.wav> [<id> <mp3> <wav> ...]
Needs ffmpeg on PATH.
"""
import json, os, subprocess, sys, tempfile
import librosa, numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
META = os.path.join(ROOT, 'tools', 'transcripts', 'meta.json')


def enc(wav, mp3, kbps, mono=False):
    cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-i', wav] + (['-ac', '1'] if mono else []) + \
          ['-codec:a', 'libmp3lame', '-b:a', f'{kbps}k', mp3]
    subprocess.run(cmd, check=True)


def main(args):
    meta = json.load(open(META)) if os.path.exists(META) else {}
    for i in range(0, len(args), 3):
        sid, src, voc_path = args[i:i + 3]
        mix, sr = librosa.load(src, sr=44100, mono=False)
        voc, _ = sf.read(voc_path, always_2d=True)
        voc = voc.T[:, :mix.shape[1]]
        inst = mix[:, :voc.shape[1]] - voc
        tempo, _ = librosa.beat.beat_track(y=librosa.to_mono(mix), sr=sr)
        with tempfile.TemporaryDirectory() as td:
            p = os.path.join(td, 'inst.wav')
            sf.write(p, np.clip(inst.T, -1, 1), sr)
            enc(p, os.path.join(ROOT, 'audio', f'{sid}_inst.mp3'), 128)
        enc(voc_path, os.path.join(ROOT, 'audio', f'{sid}_vocals.mp3'), 96, mono=True)
        meta[sid] = dict(duration=round(mix.shape[1] / sr, 2), bpm=int(round(float(np.atleast_1d(tempo)[0]))))
        print(sid, meta[sid])
    json.dump(meta, open(META, 'w'), indent=1)


if __name__ == '__main__':
    main(sys.argv[1:])
