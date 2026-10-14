"""
tools/make_placeholder_assets.py
Membuat file PLACEHOLDER (bukan foto/lagu asli):
  - foto netral & cover lagu (SVG) di static/images/photos/
  - ilustrasi pasangan minimalis di static/images/stickers/
  - lagu music-box singkat buatan sendiri (original, bebas hak cipta) di static/music/oursong.wav
Jalankan dari folder proyek:  python tools/make_placeholder_assets.py
Tidak wajib dijalankan lagi; file hasilnya sudah ada di proyek.
"""
import math
import random
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "static/images/photos"
STICKERS = ROOT / "static/images/stickers"
MUSIC = ROOT / "static/music"
for d in (PHOTOS, STICKERS, MUSIC):
    d.mkdir(parents=True, exist_ok=True)

TINTS = ["#C9E3F5", "#D6EAF8", "#BBD8EF", "#DCEEFA", "#C2DDF1", "#CFE6F6", "#B9D5EB", "#D3E8F7"]
FONT = "font-family='Nunito, Arial, sans-serif'"


def card_svg(w, h, tint, label, sub):
    cx, cy = w / 2, h / 2 - 14
    return f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}' width='{w}' height='{h}'>
<rect width='{w}' height='{h}' fill='{tint}'/>
<g transform='translate({cx - 28} {cy - 24}) scale(2.3)' fill='none' stroke='#30343B' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' opacity='.55'>
<rect x='1' y='4' width='22' height='15' rx='3'/><circle cx='12' cy='11.5' r='3.6'/><path d='M7 4l1.6-2.6h6.8L17 4'/></g>
<text x='{cx}' y='{cy + 62}' text-anchor='middle' {FONT} font-size='{w * 0.075:.0f}' font-weight='800' fill='#30343B' opacity='.7'>{label}</text>
<text x='{cx}' y='{cy + 62 + w * 0.085:.0f}' text-anchor='middle' {FONT} font-size='{w * 0.045:.0f}' fill='#30343B' opacity='.5'>{sub}</text>
</svg>"""


def write(path, text):
    path.write_text(text, encoding="utf-8")


write(PHOTOS / "placeholder.svg", card_svg(400, 400, "#EAF4FB", "Foto belum ada", "cek nama file &amp; folder"))
write(PHOTOS / "couple.svg", card_svg(400, 500, "#C9E3F5", "Foto kita di sini", "ganti dengan couple.jpg"))
for i in range(1, 9):
    h = 500 if i % 2 == 0 else 400
    write(PHOTOS / f"photo{i}.svg", card_svg(400, h, TINTS[i - 1], f"Foto {i}", "ganti dengan fotomu"))
for i in range(1, 4):
    write(PHOTOS / f"cover{i}.svg",
          f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='200' height='200'>
<rect width='200' height='200' fill='{TINTS[i]}'/>
<g transform='translate(66 50) scale(3.1)' fill='none' stroke='#30343B' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' opacity='.55'>
<path d='M9 18V6l10-2v12'/><circle cx='7' cy='18' r='2'/><circle cx='17' cy='16' r='2'/></g>
<text x='100' y='172' text-anchor='middle' {FONT} font-size='18' font-weight='800' fill='#30343B' opacity='.65'>Cover lagu {i}</text></svg>""")

# Ilustrasi pasangan minimalis (dekoratif, bukan foto)
write(STICKERS / "couple-doodle.svg", """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150' width='200' height='150' fill='none' stroke='#30343B' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'>
<circle cx='72' cy='48' r='20' fill='#FBE3D3'/><path d='M52 44c2-16 30-20 40-4' fill='#30343B'/>
<rect x='50' y='72' width='44' height='52' rx='20' fill='#C9E3F5'/>
<circle cx='132' cy='52' r='18' fill='#FBE3D3'/><path d='M114 50c0-20 36-22 36 0c-8-8-26-10-36 0z' fill='#30343B'/>
<rect x='112' y='74' width='40' height='50' rx='18' fill='#A9C9E8'/>
<path d='M94 100h18'/><path d='M102 30c0-6 8-6 8 0c0-6 8-6 8 0c0 6-8 10-8 12c0-2-8-6-8-12z' fill='#C9E3F5' stroke-width='2' transform='translate(-8 -12)'/></svg>""")

# ---------------------------------------------------------------- musik (music-box sederhana)
SR = 22050
BPM = 76
BEAT = 60 / BPM
random.seed(7)
freq = lambda n: 440 * 2 ** ((n - 69) / 12)
CHORDS = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]   # C - Am - F - G
BARS = 16
total = int((BARS * 4 * BEAT + 3) * SR)
buf = [0.0] * total


def note(start, midi, dur, amp):
    f0, s = freq(midi), int(start * SR)
    n = min(int(dur * SR), total - s)
    for k in range(max(n, 0)):
        t = k / SR
        env = min(1, t / 0.004) * math.exp(-t / 0.75)
        v = (math.sin(2 * math.pi * f0 * t) + .35 * math.sin(2 * math.pi * f0 * 2 * t)
             + .12 * math.sin(2 * math.pi * f0 * 3.01 * t)) * env
        buf[s + k] += v * amp


for bar in range(BARS):
    chord = CHORDS[bar % 4]
    t0 = bar * 4 * BEAT
    for i in range(8):                                   # arpeggio
        note(t0 + i * BEAT / 2, chord[[0, 1, 2, 1, 0, 1, 2, 1][i]] + 12, 1.6, .22)
    note(t0, chord[0] - 12, 2.4, .25)                    # bass
    pool = [c + 24 for c in chord] + [chord[0] + 26]
    for i in range(4):                                   # melodi
        if random.random() < .8:
            note(t0 + i * BEAT, random.choice(pool), 1.8, .2)

delay = int(.23 * SR)
for i in range(delay, total):                            # gema halus
    buf[i] += .22 * buf[i - delay]
peak = max(abs(x) for x in buf) or 1
fade = int(2.5 * SR)
with wave.open(str(MUSIC / "oursong.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    frames = bytearray()
    for i, x in enumerate(buf):
        g = min(1, (total - i) / fade)
        frames += struct.pack("<h", int(max(-1, min(1, x / peak * .7 * g)) * 32767))
    w.writeframes(bytes(frames))
print("selesai:", len(list(PHOTOS.glob('*.svg'))), "svg;", f"musik {total / SR:.0f} detik")
