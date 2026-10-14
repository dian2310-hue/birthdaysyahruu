/* auth.js - enam kotak PIN + kirim password ke server untuk diperiksa. */
(function () {
  'use strict';
  const { $, $$ } = window.BD;
  const boxes = $$('#pin input');
  const pin = $('#pin');
  const err = $('#pin-error');
  const btn = $('#btn-unlock');

  const value = () => boxes.map((b) => b.value).join('');
  function refresh() {
    boxes.forEach((b) => b.classList.toggle('filled', b.value !== ''));
    btn.disabled = value().length !== 6;
  }
  function shake() {
    pin.classList.remove('shake');
    void pin.offsetWidth;
    pin.classList.add('shake');
  }

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      const d = box.value.replace(/\D/g, '');
      box.value = d.slice(-1);                    // hanya angka, satu digit
      err.textContent = '';
      if (d && i < 5) boxes[i + 1].focus();       // otomatis ke kotak berikutnya
      refresh();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && box.value === '' && i > 0) {
        boxes[i - 1].focus(); boxes[i - 1].value = ''; e.preventDefault(); refresh();
      } else if (e.key === 'ArrowLeft' && i > 0) boxes[i - 1].focus();
      else if (e.key === 'ArrowRight' && i < 5) boxes[i + 1].focus();
      else if (e.key === 'Enter') submit();
    });
    // Beberapa keyboard HP tidak mengirim "Backspace" di kotak kosong.
    box.addEventListener('beforeinput', (e) => {
      if (e.inputType === 'deleteContentBackward' && box.value === '' && i > 0) {
        boxes[i - 1].focus(); boxes[i - 1].value = ''; refresh();
      }
    });
    box.addEventListener('paste', (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      if (!text) return;
      e.preventDefault();
      [...text].forEach((c, k) => { boxes[k].value = c; });
      boxes[Math.min(text.length, 5)].focus();
      refresh();
    });
    box.addEventListener('focus', () => box.select());
  });

  async function submit() {
    const code = value();
    if (!/^\d{6}$/.test(code)) { err.textContent = 'Isi enam angkanya dulu ya, baby.'; shake(); return; }
    btn.disabled = true;
    btn.textContent = 'Checking...';
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { await enter(); return; }
      err.textContent = data.message || 'Hmm, coba ingat-ingat lagi ya, baby';
      shake();
      boxes.forEach((b) => (b.value = ''));
      boxes[0].focus();
    } catch (e) {
      err.textContent = 'Server belum menyala. Pastikan "python app.py" masih berjalan.';
    } finally {
      btn.textContent = 'Unlock';
      refresh();
    }
  }

  async function enter() {
    const res = await fetch('/partial/home', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Gagal memuat isi website');
    $('#app-root').innerHTML = await res.text();
    window.BD.unlocked = true;
    document.dispatchEvent(new CustomEvent('app:ready'));
    window.BD.showView('dashboard', { push: false });
    history.replaceState(null, '', '#dashboard');
    window.BD.showScreen('app');
    boxes.forEach((b) => (b.value = ''));
    refresh();
  }

  btn.addEventListener('click', submit);
  refresh();
})();
