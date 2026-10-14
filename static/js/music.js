/* music.js - satu pemutar musik untuk seluruh website. */
(function () {
  'use strict';
  const { $, $$ } = window.BD;
  const audio = $('#bgm');
  const pill = $('#music-pill');
  const label = $('#music-label');
  const btn = $('#music-btn');
  const title = document.body.dataset.musicTitle || 'Lagu kita';

  audio.volume = 0.35;                       // volume awal rendah & nyaman
  let failed = !audio.getAttribute('src');   // belum ada file musik sama sekali

  function playing() { return !audio.paused && !audio.ended; }

  function ui() {
    const on = playing();
    pill.classList.toggle('is-playing', on);
    btn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
    btn.querySelector('use').setAttribute('href', on ? '#i-pause' : '#i-play');
    label.textContent = failed ? 'Musik belum tersedia' : on ? 'Lagu: ' + title : 'Putar lagu kita';
    $$('[data-music-toggle]').forEach((b) => {
      const l = b.querySelector('.mt-label');
      if (l) l.textContent = failed ? 'Musik belum tersedia' : on ? 'Stop lagu' : 'Putar lagu kita';
    });
  }

  async function start() {
    if (failed) {
      window.BD.toast('File musik belum ditemukan. Taruh oursong.mp3 di folder static/music/ ya.');
      ui();
      return false;
    }
    try {
      await audio.play();
      return true;
    } catch (err) {
      window.BD.toast('Musik belum bisa diputar. Coba tekan tombol play di pojok kanan atas.');
      ui();
      return false;
    }
  }

  function toggle() { if (playing()) audio.pause(); else start(); }

  ['play', 'pause', 'ended'].forEach((ev) => audio.addEventListener(ev, ui));
  audio.addEventListener('error', () => { failed = true; ui(); });
  btn.addEventListener('click', toggle);
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-music-toggle]')) toggle();
  });
  document.addEventListener('app:ready', ui);

  window.BD.Music = { start, toggle, pause: () => audio.pause(), isPlaying: playing };
  ui();
})();
