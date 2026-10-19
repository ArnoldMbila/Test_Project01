"""Builds data/songs.js and data/offenbarung.js from the analysis outputs.

Inputs (tools/transcripts/):
  offenbarung.json        all 405 verses (parsed from the Zion-Arcade PDF)
  <id>.words.json         word timestamps of the isolated vocal stem (speech-to-text)
  <id>.pitch.json         melody notes extracted from the vocal stem (extract_melody.py)

The transcript only provides *timing*. Displayed lyrics come from the canonical
Elberfelder verse text; words the singer adds (ad-libs, repeats) become extra
"ad-lib" lines. Usage:  python tools/build_songs.py [--bpm 2_12_29=98 ...]
"""
import difflib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(ROOT, 'tools', 'transcripts')

SONGS = [
    dict(id='offb_2_12_29', chapter=2, v0=12, v1=29, title='Pergamon & Thyatira',
         subtitle='Sendschreiben an zwei Gemeinden', genre='Afro', color='#ff7a45', emoji='✉️'),
    dict(id='offb_8_7_13', chapter=8, v0=7, v1=13, title='Die vier Posaunen',
         subtitle='Hagel, Feuer und der Stern Wermut', genre='Afro', color='#3fb6ff', emoji='📯'),
    dict(id='offb_13_10_18', chapter=13, v0=10, v1=18, title='Die Zahl des Tieres',
         subtitle='Das zweite Tier und sein Malzeichen', genre='Afro', color='#b06cff', emoji='👹'),
]

PUNCT_BREAK = re.compile(r'[,;:.!?]["“”»«]?$')
STRONG_BREAK = re.compile(r'[.!?:]["“”»«]?$')


def norm(w):
    w = w.lower().replace('ß', 'ss')
    return re.sub(r'[^a-zäöü0-9]', '', w)


def align(canon, heard):
    """canon: [(word, verse)], heard: [{text,start,end}] -> token list."""
    a = [norm(w) for w, _ in canon]
    b = [norm(h['text']) for h in heard]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    toks = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal':
            for k in range(i2 - i1):
                h = heard[j1 + k]
                toks.append(dict(w=canon[i1 + k][0], v=canon[i1 + k][1], t0=h['start'], t1=h['end']))
        elif op == 'replace':
            t0, t1 = heard[j1]['start'], heard[j2 - 1]['end']
            span = canon[i1:i2]
            total = sum(len(w) + 1 for w, _ in span)
            acc = 0
            for w, v in span:
                s = t0 + (t1 - t0) * acc / total
                acc += len(w) + 1
                toks.append(dict(w=w, v=v, t0=round(s, 3), t1=round(t0 + (t1 - t0) * acc / total, 3)))
        elif op == 'delete':
            for w, v in canon[i1:i2]:
                toks.append(dict(w=w, v=v, t0=None, t1=None))
        elif op == 'insert':
            for h in heard[j1:j2]:
                toks.append(dict(w=h['text'], v=None, t0=h['start'], t1=h['end'], adlib=True))
    # interpolate words the singer skipped / the recogniser missed
    for i, t in enumerate(toks):
        if t['t0'] is None:
            prev = next((toks[k]['t1'] for k in range(i - 1, -1, -1) if toks[k]['t1'] is not None), 0)
            nxt = next((toks[k]['t0'] for k in range(i + 1, len(toks)) if toks[k]['t0'] is not None), prev + 0.4)
            t['t0'], t['t1'] = prev, max(prev, min(nxt, prev + 0.3))
            t['missing'] = True
    return toks


def split_long(chunk, max_words=8):
    """Recursively split a phrase at the best pause/punctuation near its middle."""
    if len(chunk) <= max_words:
        return [chunk]
    best, best_i = None, None
    for i in range(3, len(chunk) - 2):
        gap = chunk[i]['t0'] - chunk[i - 1]['t1']
        score = gap * 4 + (1.5 if PUNCT_BREAK.search(chunk[i - 1]['w']) else 0) - abs(i - len(chunk) / 2) * 0.15
        if best is None or score > best:
            best, best_i = score, i
    if best_i is None:
        return [chunk]
    return split_long(chunk[:best_i], max_words) + split_long(chunk[best_i:], max_words)


def to_lines(toks):
    chunks, cur = [], []
    for t in toks:
        if cur:
            gap = t['t0'] - cur[-1]['t1']
            kind_change = bool(t.get('adlib')) != bool(cur[-1].get('adlib'))
            verse_change = t['v'] is not None and cur[-1]['v'] is not None and t['v'] != cur[-1]['v']
            last = cur[-1]['w']
            if (kind_change or verse_change or gap > 0.9 or
                    (len(cur) >= 2 and STRONG_BREAK.search(last)) or
                    (len(cur) >= 4 and PUNCT_BREAK.search(last) and gap > 0.25)):
                chunks.append(cur)
                cur = []
        cur.append(t)
    if cur:
        chunks.append(cur)
    lines = []
    for ch in chunks:
        for part in split_long(ch):
            verse = next((t['v'] for t in part if t['v'] is not None), None)
            lines.append(dict(t0=round(part[0]['t0'], 3), t1=round(part[-1]['t1'], 3), v=verse,
                              adlib=all(t.get('adlib') for t in part),
                              words=[[t['w'], round(t['t0'], 3), round(t['t1'], 3)] for t in part]))
    # ad-lib lines inherit the verse of the line before them (for section practice)
    last_v = None
    for ln in lines:
        if ln['v'] is None:
            ln['v'] = last_v
        last_v = ln['v'] if ln['v'] is not None else last_v
    if lines and lines[0]['v'] is None:
        first = next((l['v'] for l in lines if l['v'] is not None), None)
        for ln in lines:
            if ln['v'] is None:
                ln['v'] = first
    return lines


def clean_notes(notes, lines):
    ps = sorted(n[2] for n in notes)
    med = ps[len(ps) // 2]
    out = []
    for s, d, p in notes:
        if abs(p - med) > 13:
            continue
        mid = s + d / 2
        if not any(l['t0'] - 0.35 <= mid <= l['t1'] + 0.35 for l in lines):
            continue
        out.append([s, d, p])
    return out


def main():
    bible = json.load(open(os.path.join(T, 'offenbarung.json')))
    meta_extra = json.load(open(os.path.join(T, 'meta.json'))) if os.path.exists(os.path.join(T, 'meta.json')) else {}
    songs = []
    for s in SONGS:
        ch = bible[s['chapter'] - 1]
        canon = []
        for v in range(s['v0'], s['v1'] + 1):
            canon += [(w, v) for w in ch['v'][v - 1].split()]
        heard = [w for w in json.load(open(os.path.join(T, s['id'] + '.words.json'))) if w.get('type', 'word') == 'word']
        toks = align(canon, heard)
        lines = to_lines(toks)
        pitch = json.load(open(os.path.join(T, s['id'] + '.pitch.json')))
        notes = clean_notes(pitch['notes'], lines)
        matched = sum(1 for t in toks if not t.get('adlib') and not t.get('missing'))
        ps = [n[2] for n in notes]
        dur = meta_extra.get(s['id'], {}).get('duration') or round(max(l['t1'] for l in lines) + 10, 2)
        song = dict(s, ref=f"Offb {s['chapter']},{s['v0']}-{s['v1']}", chapterTitle=ch['title'],
                    audio=dict(instrumental=f"audio/{s['id']}_inst.mp3", vocals=f"audio/{s['id']}_vocals.mp3",
                               cover=f"audio/{s['id']}.jpg"),
                    duration=dur, bpm=meta_extra.get(s['id'], {}).get('bpm'),
                    range=[min(ps), max(ps)], lines=lines, notes=notes,
                    contourHz=pitch['contourHz'], contour=pitch['contour'])
        songs.append(song)
        print(f"{s['id']}: {len(lines)} lines, {len(notes)} notes, range {min(ps)}-{max(ps)}, "
              f"{matched}/{len(canon)} canonical words matched")
    with open(os.path.join(ROOT, 'data', 'songs.js'), 'w') as f:
        f.write('/* Generiert von tools/build_songs.py – nicht von Hand bearbeiten. */\n')
        f.write('window.ZS_SONGS = ' + json.dumps(songs, ensure_ascii=False, separators=(',', ':')) + ';\n')
    with open(os.path.join(ROOT, 'data', 'offenbarung.js'), 'w') as f:
        f.write('/* Offenbarung 1–22 (Elberfelder), aus „Zion-Arcade Offenbarung – Alle Verse“. Generiert von tools/build_songs.py. */\n')
        f.write('window.ZS_BIBLE = ' + json.dumps(bible, ensure_ascii=False, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    main()
