/* gallery.js - lightbox foto (buka, tutup, geser). */
(function () {
  'use strict';
  const { $, $$ } = window.BD;
  const lb = $('#lightbox');
  const img = $('#lb-img');
  const cap = $('#lb-caption');
  let index = 0;
  let lastFocus = null;

  const items = () => $$('.memory');

  function show(i) {
    const list = items();
    if (!list.length) return;
    index = (i + list.length) % list.length;
    const item = list[index];
    const thumb = $('img', item);
    img.src = thumb.currentSrc || thumb.src;
    img.alt = item.dataset.caption;
    cap.textContent = item.dataset.caption;
  }
  function open(i, trigger) {
    lastFocus = trigger;
    show(i);
    lb.hidden = false;
    document.body.classList.add('no-scroll');
    $('#lb-close').focus();
  }
  function close() {
    lb.hidden = true;
    document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('click', (e) => {
    const m = e.target.closest('.memory');
    if (m) open(items().indexOf(m), m);
  });
  $('#lb-close').addEventListener('click', close);
  $('#lb-prev').addEventListener('click', () => show(index - 1));
  $('#lb-next').addEventListener('click', () => show(index + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
})();
