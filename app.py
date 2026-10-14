"""
app.py - "Otak" (backend) website ulang tahun.

Tugas file ini:
  1. Menyajikan halaman (index.html lalu home.html / hasil kuis setelah password benar).
  2. Memeriksa password DI SERVER (bukan cuma di JavaScript).
  3. Memeriksa & menyimpan jawaban kuis, lalu menghitung "Love Percentage".

Cara menjalankan (lokal):   python app.py
Supaya bisa dibuka dari HP: python app.py --lan
"""
import hmac
import json
import os
import re
import socket
import sys
import time
from datetime import datetime
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, render_template, request, session

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"

# ---------------------------------------------------------------------------
# PENGATURAN  (bisa diubah di sini, atau lewat environment variable)
# ---------------------------------------------------------------------------
# Password enam digit. Untuk mengganti: ubah angka "251004" di bawah ini,
# atau set environment variable BIRTHDAY_PASSWORD.
PASSWORD = os.environ.get("BIRTHDAY_PASSWORD", "251004")

# Lagu latar diulang terus (True) atau berhenti setelah selesai (False).
MUSIC_LOOP = False

# Kunci rahasia untuk cookie sesi. WAJIB diganti saat dipublikasikan ke internet.
SECRET_KEY = os.environ.get("SECRET_KEY", "ganti-teks-ini-dengan-acak-sebelum-publish")

MAX_FAILS = 5          # salah password berapa kali sebelum "istirahat"
LOCK_SECONDS = 30      # lama istirahatnya (detik)

app = Flask(__name__)
app.secret_key = SECRET_KEY
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    TEMPLATES_AUTO_RELOAD=True,
)
app.json.ensure_ascii = False


# ---------------------------------------------------------------------------
# FUNGSI BANTU
# ---------------------------------------------------------------------------
def load_json(name):
    """Baca file JSON di folder data/ (dibaca ulang setiap request,
    jadi setelah mengedit JSON cukup refresh browser)."""
    with open(DATA_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def find_music():
    """Cari file musik di static/music/, dengan lagu pilihan sebelum placeholder."""
    for filename in (
        "oursong.wav",
        "oursong.mp3",
        "oursong.m4a",
        "oursong.ogg",
        # "soundtrack.wav",
    ):
        if (STATIC_DIR / "music" / filename).exists():
            return f"music/{filename}"
    return None


def ordinal(n):
    """22 -> '22nd', 21 -> '21st', 23 -> '23rd', 24 -> '24th'."""
    if 10 <= n % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


SPOTIFY_RE = re.compile(
    r"^https://open\.spotify\.com/(?:intl-[a-z]{2}/)?(track|album|playlist|episode)/([A-Za-z0-9]+)"
)


def spotify_embed_url(url):
    """Ubah link Spotify biasa menjadi link embed resmi. Kosong/tidak valid -> ''."""
    m = SPOTIFY_RE.match((url or "").strip())
    return f"https://open.spotify.com/embed/{m.group(1)}/{m.group(2)}" if m else ""


def validate_answers(raw, quiz):
    """Pastikan jawaban kuis lengkap & valid. Return (jawaban_bersih, pesan_error)."""
    if not isinstance(raw, dict):
        return None, "Format jawaban tidak dikenali."
    clean = {}
    for q in quiz:
        value = raw.get(q["id"])
        if q["type"] == "multi":
            if not isinstance(value, list):
                return None, "Masih ada pertanyaan yang belum dijawab."
            chosen = [opt for opt in q["options"] if opt in value]  # buang pilihan asing
            if not chosen:
                return None, "Masih ada pertanyaan yang belum dijawab."
            clean[q["id"]] = chosen
        else:
            if not isinstance(value, str) or not value.strip():
                return None, "Pesan buat aAdek belum diisi."
            clean[q["id"]] = value.strip()[: q.get("max_length", 1000)]
    return clean, None


def love_percentage(_answers):
    """Versi pertama: kuis yang sudah lengkap selalu 100% (hasil permainan, bukan ilmiah)."""
    return 100


def build_report(answers, quiz, percent):
    """Teks laporan yang bisa disalin / diunduh."""
    lines = [
        "YOUR LOVE REPORT <3",
        f"Result: {percent}% certified sayang adek.",
        "(Ini hasil permainan, bukan ukuran cinta yang sebenarnya.)",
        "",
    ]
    for i, q in enumerate(quiz, 1):
        value = answers[q["id"]]
        shown = ", ".join(value) if isinstance(value, list) else value
        lines += [f"{i}. {q['text']}", f"   -> {shown}", ""]
    lines.append(f"Dibuat pada {datetime.now():%d %B %Y, %H:%M}")
    return "\n".join(lines)


def require_unlock(view):
    """Pembatas: endpoint hanya bisa dipakai kalau password sudah benar."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        if not session.get("unlocked"):
            return jsonify(ok=False, message="Masukkan password dulu yasayang."), 403
        return view(*args, **kwargs)

    return wrapper


# ---------------------------------------------------------------------------
# HALAMAN & API
# ---------------------------------------------------------------------------
@app.get("/")
def index():
    """Halaman pembuka (hati -> undangan -> password). Isi rahasia TIDAK ada di sini."""
    session.pop("unlocked", None)  # setiap kali web dibuka, password diminta lagi
    content = load_json("content.json")
    return render_template(
        "index.html",
        site=content,
        music_url=find_music(),
        music_loop=MUSIC_LOOP,
    )


@app.post("/api/unlock")
def api_unlock():
    """Cek password di server."""
    now = time.time()
    if session.get("lock_until", 0) > now:
        return jsonify(ok=False, message="Pelan-pelan ya sayang, tunggu sebentar lalu coba lagi."), 429

    body = request.get_json(silent=True) or {}
    pin = str(body.get("pin", ""))

    if re.fullmatch(r"\d{6}", pin) and hmac.compare_digest(pin, PASSWORD):
        session["unlocked"] = True
        session["fails"] = 0
        return jsonify(ok=True)

    session["fails"] = session.get("fails", 0) + 1
    if session["fails"] >= MAX_FAILS:
        session["fails"] = 0
        session["lock_until"] = now + LOCK_SECONDS
    return jsonify(ok=False, message="Eumm, coba ingat-ingat lagi ya, baby"), 401


@app.get("/partial/home")
@require_unlock
def partial_home():
    """Dashboard + semua menu. Hanya diberikan kalau password benar."""
    content = load_json("content.json")
    songs = load_json("songs.json")
    for song in songs:
        song["embed"] = spotify_embed_url(song.get("spotify_url"))
    return render_template(
        "home.html",
        c=content,
        age_label=ordinal(content["age"]),
        quiz=load_json("quiz.json"),
        songs=songs,
    )


@app.post("/api/submit")
@require_unlock
def api_submit():
    """Validasi jawaban kuis, simpan, lalu kirim balik halaman hasil (HTML)."""
    quiz = load_json("quiz.json")
    body = request.get_json(silent=True) or {}
    answers, error = validate_answers(body.get("answers"), quiz)
    if error:
        return jsonify(ok=False, message=error), 400

    session["answers"] = answers
    # Simpan ke file di server hanya saat benar-benar "Send" (bukan saat melihat ulang).
    if body.get("save", True):
        try:
            with open(DATA_DIR / "answers.jsonl", "a", encoding="utf-8") as f:
                f.write(json.dumps({"time": datetime.now().isoformat(timespec="seconds"),
                                    "answers": answers}, ensure_ascii=False) + "\n")
        except OSError:
            pass  # kalau gagal menulis file, hasil tetap tampil

    percent = love_percentage(answers)
    html = render_template(
        "result.html",
        answers=answers,
        quiz=quiz,
        percent=percent,
        report=build_report(answers, quiz, percent),
    )
    return jsonify(ok=True, percent=percent, html=html)


# ---------------------------------------------------------------------------
# MENJALANKAN SERVER
# ---------------------------------------------------------------------------
def lan_ip():
    """Alamat IP laptop di Wi-Fi (untuk dibuka dari HP)."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return "IP-LAPTOP-KAMU"
    finally:
        s.close()


if __name__ == "__main__":
    lan = "--lan" in sys.argv
    port = int(os.environ.get("PORT", 5000))
    if lan:
        print(f"\n  Buka dari HP (satu Wi-Fi):  http://{lan_ip()}:{port}\n")
    app.run(host="0.0.0.0" if lan else "127.0.0.1", port=port, debug=not lan)
