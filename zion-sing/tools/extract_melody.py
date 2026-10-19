import sys, json, numpy as np, librosa, scipy.signal as ss
src, out = sys.argv[1], sys.argv[2]
SR, HOP = 22050, 256
y, _ = librosa.load(src, sr=SR, mono=True)
f0, vflag, vprob = librosa.pyin(y, fmin=65, fmax=1050, sr=SR, frame_length=2048, hop_length=HOP)
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=HOP)[0][:len(f0)]
dt = HOP / SR
midi = np.where(vflag & (rms > 0.01), librosa.hz_to_midi(np.nan_to_num(f0, nan=1.0)), np.nan)
# median smooth voiced runs
sm = midi.copy()
for i in range(len(midi)):
    w = midi[max(0, i - 3):i + 4]
    w = w[~np.isnan(w)]
    if not np.isnan(midi[i]) and len(w): sm[i] = np.median(w)
notes = []
cur = None
for i, m in enumerate(sm):
    if np.isnan(m):
        if cur: notes.append(cur); cur = None
        continue
    if cur and abs(m - np.median(cur['v'])) < 0.8:
        cur['v'].append(m); cur['e'] = i
    else:
        if cur: notes.append(cur)
        cur = {'s': i, 'e': i, 'v': [m]}
if cur: notes.append(cur)
res = []
for n in notes:
    d = (n['e'] - n['s'] + 1) * dt
    if d < 0.09: continue
    p = int(round(float(np.median(n['v']))))
    s = n['s'] * dt
    if res and res[-1][2] == p and s - (res[-1][0] + res[-1][1]) < 0.08:
        res[-1][1] = round(s + d - res[-1][0], 3)
    else:
        res.append([round(s, 3), round(d, 3), p])
# contour at 25 Hz for the guide line (midi*10 ints, 0 = unvoiced)
step = int(round(0.04 / dt))
cont = [0 if np.isnan(x) else int(round(x * 10)) for x in sm[::step]]
json.dump({'notes': res, 'contourHz': 25, 'contour': cont}, open(out, 'w'))
ps = [r[2] for r in res]
print(out, len(res), 'notes, range', min(ps), max(ps), 'median', int(np.median(ps)))
