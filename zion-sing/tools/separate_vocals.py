import sys, numpy as np, librosa, soundfile as sf, onnxruntime as ort
# UVR-MDX-NET-Voc_FT: n_fft 7680, hop 1024, dim_f 3072, dim_t 256, compensate 1.021
NFFT, HOP, DF, DT, COMP = 7680, 1024, 3072, 256, 1.021
CH = HOP * (DT - 1); TRIM = NFFT // 2; GEN = CH - 2 * TRIM
sess = ort.InferenceSession(sys.argv[1], providers=['CPUExecutionProvider'])
src, out = sys.argv[2], sys.argv[3]
mix, sr = librosa.load(src, sr=44100, mono=False)
n = mix.shape[1]
pad = GEN - n % GEN
mp = np.concatenate([np.zeros((2, TRIM)), mix, np.zeros((2, pad)), np.zeros((2, TRIM))], 1).astype(np.float32)
res = []
i = 0
while i < n + pad:
    w = mp[:, i:i + CH]
    specs = []
    for c in range(2):
        S = librosa.stft(w[c], n_fft=NFFT, hop_length=HOP, window='hann', center=True, pad_mode='reflect')[:DF]
        specs += [S.real, S.imag]
    x = np.stack(specs)[None].astype(np.float32)
    y = sess.run(None, {'input': x})[0][0]
    o = []
    for c in range(2):
        Z = np.zeros((NFFT // 2 + 1, DT), np.complex64)
        Z[:DF] = y[2 * c] + 1j * y[2 * c + 1]
        o.append(librosa.istft(Z, n_fft=NFFT, hop_length=HOP, window='hann', center=True, length=CH))
    res.append(np.stack(o)[:, TRIM:-TRIM])
    i += GEN
voc = np.concatenate(res, 1)[:, :n] * COMP
sf.write(out, voc.T, sr)
print('ok', out, voc.shape)
