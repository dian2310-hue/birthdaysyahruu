/* letter.js - animasi membuka amplop & menampilkan surat. */
(function () {
  'use strict';
  const { $, wait } = window.BD;

  document.addEventListener('app:ready', () => {
    const env = $('#envelope');
    const openBtn = $('#btn-open-letter');
    const paper = $('#letter-paper');
    const actions = $('#letter-actions');

    function reveal() {
      paper.classList.remove('reveal');
      void paper.offsetWidth;            // memulai ulang animasi
      paper.classList.add('reveal');
    }

    openBtn.addEventListener('click', () => {
      openBtn.hidden = true;
      env.classList.add('open');
      setTimeout(() => env.classList.add('gone'), wait(1300));
      setTimeout(() => {
        env.hidden = true;
        paper.hidden = false;
        actions.hidden = false;
        reveal();
        paper.scrollIntoView({ behavior: wait(1) ? 'smooth' : 'auto', block: 'start' });
      }, wait(1900));
    });

    $('#btn-read-again').addEventListener('click', () => {
      paper.scrollIntoView({ block: 'start' });
      reveal();
    });
  });
})();
