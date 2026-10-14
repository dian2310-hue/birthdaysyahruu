# A Little Birthday Gift for My Favorite Boy

Website kado ulang tahun interaktif (Python Flask + HTML + CSS + JavaScript).

Alur: **ketuk hati** (musik mulai) -> undangan -> **password** -> dashboard -> 4 menu
(Surat, Galeri, Kuis + Love Report, Playlist).

---

## 1. Struktur proyek dan fungsi tiap file

```
birthday-website/
├── app.py                  Backend Flask: halaman, cek password di server, validasi & simpan kuis
├── requirements.txt        Daftar library Python (Flask, gunicorn)
├── README.md               Panduan ini
├── data/                   Semua isi yang boleh kamu edit (tanpa menyentuh kode)
│   ├── content.json        Nama panggilan, umur, tanggal, isi surat, daftar foto + caption
│   ├── quiz.json           Pertanyaan & pilihan kuis
│   ├── songs.json          3 lagu playlist (judul, artis, cover, alasan, link Spotify)
│   └── answers.jsonl       (dibuat otomatis) jawaban kuis yang dikirim
├── templates/              Kerangka HTML
│   ├── index.html          Hati, undangan, password, pemutar musik, lightbox (kerangka utama)
│   ├── home.html           Dashboard; menggabungkan menu-menu di bawah
│   ├── result.html         Halaman "Your Love Report"
│   └── partials/           Potongan HTML: _chibi.html, letter.html, memories.html,
│                           quiz.html, playlist.html
├── static/
│   ├── css/style.css       Warna, layout dasar, hati, undangan, password, dashboard, musik
│   ├── css/pages.css       Surat, galeri, kuis, hasil, playlist
│   ├── js/script.js        Inti: pindah layar/menu, hati pembuka, dialog, hati melayang
│   ├── js/music.js         Satu pemutar musik untuk seluruh website
│   ├── js/auth.js          Enam kotak PIN + kirim password ke server
│   ├── js/letter.js        Animasi amplop & surat
│   ├── js/gallery.js       Lightbox foto
│   ├── js/quiz.js          Kuis, penyimpanan jawaban, hasil, salin/unduh
│   ├── js/playlist.js      Spotify embed
│   ├── images/photos/      Foto & cover (sekarang masih placeholder SVG)
│   ├── images/stickers/    Ilustrasi dekoratif (couple-doodle.svg)
│   └── music/              Taruh lagu kamu di sini
└── tools/make_placeholder_assets.py   Pembuat placeholder (opsional)
```

Stiker cowok chibi digambar sebagai SVG di `templates/partials/_chibi.html`.

**Pembagian tugas:** Python/Flask mengatur halaman, memeriksa password, dan memproses jawaban.
Animasi, musik, tombol, galeri, dan kuis berjalan di browser (HTML/CSS/JS).

---

## 2. Instal Python dan Flask

1. Pasang Python 3.9+ dari https://www.python.org/downloads/
   (Windows: centang **Add Python to PATH** saat instal).
2. Buka terminal/Command Prompt di folder `birthday-website`.
3. (Disarankan) buat lingkungan virtual:
   - Windows: `python -m venv venv` lalu `venv\Scripts\activate`
   - Mac/Linux: `python3 -m venv venv` lalu `source venv/bin/activate`
4. Pasang library: `pip install -r requirements.txt`

## 3. Menjalankan dan membuka di browser

```
python app.py
```
Lalu buka **http://127.0.0.1:5000** di browser. Hentikan server dengan `Ctrl + C`.
Setelah mengedit file di `data/` cukup refresh browser. Setelah mengedit `app.py` server
memuat ulang sendiri (mode debug).

> Font Nunito & Playfair Display dimuat dari Google Fonts, jadi butuh internet.
> Tanpa internet, website tetap jalan dengan font bawaan perangkat.

## 4. Membuka dari HP (satu Wi-Fi dengan laptop)

1. Jalankan: `python app.py --lan`
2. Terminal menampilkan alamat seperti `http://192.168.1.10:5000`.
3. Buka alamat itu di browser HP. Kalau tidak bisa, izinkan Python di firewall laptop.

Mode `--lan` mematikan mode debug demi keamanan jaringan.

---

## 5. Cara mengubah isi

**Password** - buka `app.py`, cari baris `PASSWORD = os.environ.get("BIRTHDAY_PASSWORD", "251004")`,
ganti `251004` dengan enam angka baru. Atau set environment variable `BIRTHDAY_PASSWORD`.

**Nama panggilan, umur, tanggal** - `data/content.json`: `nickname`, `age`, `birthday_display`.

**Isi surat** - `data/content.json`, bagian `letter`. Setiap item di dalam daftar = satu paragraf.
Isi surat sekarang sama persis dengan teks yang kamu tulis.

**Foto dan caption**
1. Taruh foto di `static/images/photos/`, misalnya `kita1.jpg` (rasio mendekati kotak/4:5 paling cantik;
   ukuran sekitar 1000 px sudah cukup, kecilkan dulu supaya loading ringan).
2. Buka `data/content.json`, bagian `photos`. Ubah `"file": "photo1.svg"` menjadi `"file": "kita1.jpg"`
   dan ubah `"caption"`.
3. Foto utama di undangan/dashboard: ubah `hero_photo` (sekarang `couple.svg`).
4. Mau lebih dari 8 foto? Tambah item baru di daftar `photos`.
Kalau nama file salah, website menampilkan placeholder dan peringatan.

**Musik latar**
1. Pakai lagu yang kamu punya hak/izin pakainya (rekaman sendiri, lagu bebas royalti, atau lisensi yang jelas).
2. Lagu `static/music/Risk it all.wav` akan dipakai terlebih dahulu. Untuk menggantinya,
   simpan lagu lain sebagai `static/music/soundtrack.mp3` (juga bisa `.m4a`, `.ogg`, `.wav`).
3. Judul yang tampil di indikator: `music_title` di `data/content.json`.
4. Lagu mulai saat hati diketuk, berlanjut di semua menu, dan tidak mengulang saat pindah menu.
   Mau diulang terus? Di `app.py` ubah `MUSIC_LOOP = False` menjadi `True`.

`soundtrack.wav` bawaan hanyalah placeholder music-box buatan sendiri (~54 detik), dan hanya dipakai
jika `Risk it all.wav` serta format lagu lain yang didukung tidak tersedia.

**Playlist Spotify** - `data/songs.json`, tiga item. Isi `title`, `artist`, `note` (alasannya),
`cover` (nama file di `static/images/photos/`), dan `spotify_url`.
Cara mengambil link: Spotify -> klik titik tiga pada lagu -> Share -> Copy Song Link.
Link berbentuk `https://open.spotify.com/track/...`. Website otomatis mengubahnya menjadi
player resmi Spotify. Kalau `spotify_url` masih kosong, tombol Listen menampilkan pesan bahwa link belum diisi.
Player Spotify hanya memutar cuplikan/lagu penuh sesuai akun Spotify yang login di browser.
Saat Listen ditekan, musik latar dijeda otomatis supaya tidak bertabrakan.

**Pertanyaan kuis** - `data/quiz.json`.

---

## 6. Soal kuis, jawaban, dan "pesan terkirim"

**Jawaban TIDAK otomatis masuk ke HP kamu.** Yang sebenarnya terjadi:
- Jawaban tersimpan di browser pacarmu (supaya tidak hilang saat pindah halaman).
- Saat dia menekan *Send my answer to Adek* dan konfirmasi, server mencatatnya di `data/answers.jsonl`
  (satu baris per pengiriman, berisi waktu dan jawaban).
- Dia bisa **menyalin** atau **mengunduh** Love Report lalu mengirimnya lewat chat.

Kalau kamu menjalankan website di laptopmu sendiri dan HP-nya terhubung lewat `--lan`, filenya ada di laptopmu.
Kalau website dipublikasikan ke internet, file itu ada di server hosting, dan banyak layanan gratis
menghapus file saat server restart. Untuk pengiriman otomatis yang andal (email/Telegram/WhatsApp, atau database)
perlu integrasi tambahan yang belum ada di versi ini.

**Love percentage** - versi pertama selalu menampilkan **100%** setelah kuis lengkap. Itu hasil
permainan, bukan ukuran cinta yang sebenarnya, dan halaman hasil menyebutkannya.

---

## 7. Mempublikasikan agar bisa dibuka lewat link

Pilih salah satu. Detail menu layanan bisa berubah, jadi ikuti panduan resmi masing-masing.

**A. PythonAnywhere (paling ramah pemula)**
1. Daftar di pythonanywhere.com, buka tab *Files*, upload folder proyek (atau zip lalu unzip lewat Bash console).
2. Tab *Web* -> *Add a new web app* -> *Flask*. Arahkan source code ke folder proyek dan file WSGI ke `app.app`
   (di file WSGI: `from app import app as application`).
3. Di Bash console: `pip install --user flask`.
4. Di tab *Web* isi *Environment variables*: `SECRET_KEY` (teks acak panjang) dan `BIRTHDAY_PASSWORD`.
5. Klik *Reload*, lalu kirim link `https://namakamu.pythonanywhere.com` ke pacarmu.

**B. Render.com (lewat GitHub)**
1. Upload proyek ke repository GitHub (file `.gitignore` sudah ada).
2. Di Render: *New* -> *Web Service* -> pilih repo.
   Build command: `pip install -r requirements.txt`. Start command: `gunicorn app:app`.
3. Tambahkan environment variable `SECRET_KEY` dan `BIRTHDAY_PASSWORD`.

**Catatan keamanan yang jujur**
- Password enam digit hanya untuk **kejutan personal**, bukan pengaman data rahasia. Di server memang
  diperiksa (bukan hanya di JavaScript) dan ada jeda otomatis setelah 5 kali salah, tapi enam angka
  tetap bisa ditebak oleh orang yang gigih.
- Kalau password ditulis langsung di `app.py` dan kodenya kamu unggah ke GitHub publik, siapa pun bisa
  membacanya. Pakai environment variable `BIRTHDAY_PASSWORD`, atau jadikan repo *private*.
- Jangan simpan data sensitif (NIK, alamat lengkap, dsb.) di website ini.
- Isi surat dan foto hanya dikirim ke browser setelah password benar, tapi file di folder `static/` (misalnya
  foto) bisa dibuka siapa pun yang tahu alamat file-nya.

---

## 8. Fitur yang sudah diuji

Password benar/salah (termasuk jeda setelah salah berulang), 6 kotak PIN (ketik, hapus, tempel, Enter),
isi menu tidak bisa diambil tanpa login, navigasi semua menu dan tombol kembali, tombol back browser,
amplop & surat, lightbox foto, kuis multi-select, jawaban tersimpan saat Back/Next, Next hanya aktif
setelah dijawab, konfirmasi sebelum kirim, validasi di server, hasil 100% beranimasi, salin & unduh laporan,
Spotify embed (menjeda musik latar), musik tidak mengulang saat pindah menu, tidak ada scroll horizontal di HP.
Animasi menghormati pengaturan "reduce motion" perangkat.

Yang belum bisa kuuji dari sini: tampilan di HP sungguhan (Safari iPhone dll.) dan Spotify embed dengan link asli.
Coba di HP-mu sendiri sebelum dikirim.

## 9. Masalah umum

- **Musik tidak berbunyi**: pastikan ada `static/music/soundtrack.mp3`; tombol musik di pojok kanan atas bisa ditekan manual.
- **Foto tidak muncul**: cek nama file (huruf besar/kecil berpengaruh) di `data/content.json`.
- **`python` tidak dikenali**: coba `python3`, atau instal ulang Python dengan opsi Add to PATH.
- **Setelah mengganti password, yang lama masih jalan**: hentikan server (`Ctrl + C`) dan jalankan lagi.
