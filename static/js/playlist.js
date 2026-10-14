/* playlist.js - Spotify embed resmi (dimuat hanya saat tombol Listen ditekan). */
(function () {
  'use strict';
  const { $, $$ } = window.BD;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-embed-toggle]');
    if (!btn) return;
    const url = btn.dataset.embed;
    if (!url) {
      window.BD.toast('Isi link Spotify dulu di data/songs.json ya.');
      return;
    }
    const card = btn.closest('.song');
    const slot = $('.embed-slot', card);
    const wasOpen = slot.dataset.open === '1';

    // tutup semua player dulu
    $$('.song .embed-slot').forEach((s) => { s.innerHTML = ''; s.dataset.open = '0'; });
    $$('[data-embed-toggle] .lbl').forEach((l) => (l.textContent = 'Listen'));
    if (wasOpen) return;

    const frame = document.createElement('iframe');
    frame.src = url;
    frame.title = 'Spotify player';
    frame.loading = 'lazy';
    frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    const note = document.createElement('p');
    note.className = 'embed-fallback';
    note.textContent = 'Kalau player tidak muncul, pakai tombol "Open in Spotify".';
    slot.append(frame, note);
    slot.dataset.open = '1';
    $('.lbl', btn).textContent = 'Close player';

    if (window.BD.Music.isPlaying()) {
      window.BD.Music.pause();
      window.BD.toast('Musik latar dijeda supaya tidak tabrakan dengan Spotify. Tekan tombol musik di pojok untuk melanjutkan.', 5200);
    }
  });
})();
