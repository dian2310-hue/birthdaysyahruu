
 /* script.js - inti: perpindahan layar/menu, hati pembuka, dialog, elemen melayang.
   File JS lain memakai fungsi-fungsi di objek global "BD" di bawah ini. */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const BD = (window.BD = { $, $$, unlocked: false, view: 'dashboard' });
  BD.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => (BD.reduceMotion ? 0 : ms);
  BD.wait = wait;

  /* ----- Notifikasi kecil ----- */
  BD.toast = function (msg, ms = 3400) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(BD._toastTimer);
    BD._toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  };

  /* ----- Transisi lembut (tirai krem) ----- */
  BD.transition = function (fn) {
    const veil = $('#veil');
    veil.classList.add('on');
    setTimeout(() => {
      fn();
      window.scrollTo(0, 0);
      requestAnimationFrame(() => veil.classList.remove('on'));
    }, wait(320));
  };

  BD.showScreen = function (name) {
    BD.transition(() => {
      $$('.screen').forEach((s) => s.classList.toggle('is-active', s.id === 'screen-' + name));
      if (name === 'password') {
        const first = $('#pin input');
        if (first) first.focus();
      }
    });
  };

  /* ----- Pindah menu di dalam website (tanpa memuat ulang halaman) ----- */
  const VIEWS = ['dashboard', 'letter', 'memories', 'quiz', 'playlist', 'result'];
  BD.showView = function (name, opts = {}) {
    if (!BD.unlocked) return;
    if (!VIEWS.includes(name)) name = 'dashboard';
    // Halaman hasil hanya ada setelah kuis dikirim; kalau belum, arahkan ke kuis.
    if (name === 'result' && !$('#love-count')) name = 'quiz';
    const target = $('.view[data-view="' + name + '"]');
    if (!target) return;
    $$('.view').forEach((v) => v.classList.toggle('is-active', v.dataset.view === name));
    window.scrollTo(0, 0);
    BD.view = name;
    if (opts.push !== false && location.hash !== '#' + name) history.pushState(null, '', '#' + name);
    document.dispatchEvent(new CustomEvent('view:change', { detail: { name } }));
  };
  window.addEventListener('popstate', () => {
    if (BD.unlocked) BD.showView(location.hash.slice(1) || 'dashboard', { push: false });
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-go]');
    if (!btn) return;
    e.preventDefault();
    if (btn.classList.contains('menu-card')) {
      btn.classList.add('tap');
      setTimeout(() => { btn.classList.remove('tap'); BD.showView(btn.dataset.go); }, wait(220));
    } else {
      BD.showView(btn.dataset.go);
    }
  });

  /* ----- Dialog konfirmasi (mengembalikan Promise true/false) ----- */
  BD.confirm = function ({ title, text, yes = 'Yes', no = 'Not yet' }) {
    return new Promise((resolve) => {
      const modal = $('#modal');
      $('#modal-title').textContent = title;
      $('#modal-text').textContent = text;
      $('#modal-yes').textContent = yes;
      $('#modal-no').textContent = no;
      modal.hidden = false;
      $('#modal-yes').focus();
      const finish = (value) => {
        modal.hidden = true;
        $('#modal-yes').onclick = $('#modal-no').onclick = null;
        resolve(value);
      };
      $('#modal-yes').onclick = () => finish(true);
      $('#modal-no').onclick = () => finish(false);
    });
  };

  /* ----- Hati pembuka: ketukan pertama = membuka hati + mulai musik ----- */
  let heartOpened = false;
  $('#heart-btn').addEventListener('click', () => {
    if (heartOpened) return;
    heartOpened = true;
    // Ketukan ini adalah interaksi pengguna, jadi browser mengizinkan musik berbunyi.
    if (BD.Music) BD.Music.start();
    $('#heart').classList.add('opening');
    setTimeout(() => {
      $('#music-pill').hidden = false;
      BD.showScreen('invite');
    }, wait(1000));
  });

  $('#btn-open-gift').addEventListener('click', () => BD.showScreen('password'));
  $('#btn-pw-back').addEventListener('click', () => BD.showScreen('invite'));

  /* ----- Gambar gagal dimuat -> tampilkan placeholder + beri tahu ----- */
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || img.dataset.failed) return;
    img.dataset.failed = '1';
    img.src = document.body.dataset.placeholder;
    const note = $('#broken-note');
    if (note && img.closest('.memory')) note.hidden = false;
    if (!BD._imgToast) { BD._imgToast = true; BD.toast('Ada gambar yang belum ditemukan, jadi dipakai placeholder.'); }
  }, true);

  /* ----- Hati & bintang melayang (sedikit saja) ----- */
  (function floaters() {
    if (BD.reduceMotion) return;
    const box = $('#floaters');
    const total = 8;
    for (let i = 0; i < total; i++) {
      const el = document.createElement('span');
      const size = 10 + Math.random() * 10;
      el.className = 'floater';
      el.style.cssText = `left:${(i + Math.random()) * (100 / total)}%;width:${size}px;height:${size}px;` +
        `animation-duration:${18 + Math.random() * 14}s;animation-delay:${-Math.random() * 24}s;`;
      el.innerHTML = '<svg aria-hidden="true"><use href="#' + (i % 3 === 0 ? 'i-star' : 'i-heart') + '"/></svg>';
      box.appendChild(el);
    }
  })();

  history.replaceState(null, '', location.pathname);
})();
