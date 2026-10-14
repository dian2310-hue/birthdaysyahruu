/* quiz.js - kuis satu-per-satu, jawaban tersimpan, kirim ke server, halaman hasil. */
(function () {
  'use strict';
  const { $, $$, wait } = window.BD;
  const KEY = 'bday_quiz_v1';

  document.addEventListener('app:ready', () => {
    const form = $('#quiz-form');
    if (!form) return;
    const cards = $$('.q-card', form);
    const total = cards.length;
    const errBox = $('#q-error');
    let st = load();

    /* ----- simpan/muat jawaban (localStorage; kalau diblokir, tetap jalan di memori) ----- */
    function load() {
      try {
        const s = JSON.parse(localStorage.getItem(KEY));
        if (s && s.answers) return { answers: s.answers, step: Math.min(s.step || 0, total - 1), done: !!s.done };
      } catch (_) { /* abaikan */ }
      return { answers: {}, step: 0, done: false };
    }
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (_) { /* abaikan */ }
    }

    function answered(card) {
      const v = st.answers[card.dataset.q];
      return card.dataset.type === 'multi' ? Array.isArray(v) && v.length > 0 : typeof v === 'string' && v.trim().length > 0;
    }

    /* ----- tampilkan pertanyaan aktif sesuai state ----- */
    function render() {
      cards.forEach((c, i) => { c.hidden = i !== st.step; });
      const card = cards[st.step];
      const q = card.dataset.q;
      if (card.dataset.type === 'multi') {
        $$('.opt', card).forEach((o) => {
          const on = (st.answers[q] || []).includes(o.dataset.value);
          o.classList.toggle('selected', on);
          o.setAttribute('aria-checked', String(on));
        });
      } else {
        const ta = $('textarea', card);
        const saved = st.answers[q] || '';
        if (ta.value !== saved) ta.value = saved;
        $('.cnt', card).textContent = ta.value.length;
      }
      $('#q-count').textContent = 'Question ' + (st.step + 1) + ' of ' + total;
      $('#q-bar').style.width = ((st.step + 1) / total) * 100 + '%';
      $('#q-back').disabled = st.step === 0;
      const last = st.step === total - 1;
      $('#q-next').hidden = last;
      $('#q-send').hidden = !last;
      const ok = answered(card);
      $('#q-next').disabled = !ok;
      $('#q-send').disabled = !ok;
      $('#quiz-done-banner').hidden = !st.done;
      errBox.textContent = '';
    }

    function sparkle(el) {
      if (window.BD.reduceMotion) return;
      for (let i = 0; i < 4; i++) {
        const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        s.setAttribute('class', 'spark');
        s.innerHTML = '<use href="#i-star"/>';
        s.style.left = 14 + Math.random() * 20 + 'px';
        s.style.top = '50%';
        s.style.setProperty('--dx', (Math.random() * 60 - 10) + 'px');
        s.style.setProperty('--dy', (Math.random() * -36 - 6) + 'px');
        el.appendChild(s);
        setTimeout(() => s.remove(), 750);
      }
    }

    /* ----- memilih jawaban (bisa banyak, bisa diganti kapan saja) ----- */
    form.addEventListener('click', (e) => {
      const opt = e.target.closest('.opt');
      if (!opt) return;
      const card = opt.closest('.q-card');
      const q = card.dataset.q;
      const chosen = new Set(st.answers[q] || []);
      const v = opt.dataset.value;
      if (chosen.has(v)) chosen.delete(v); else chosen.add(v);
      st.answers[q] = $$('.opt', card).map((o) => o.dataset.value).filter((x) => chosen.has(x));
      st.done = false;
      opt.classList.remove('pop'); void opt.offsetWidth; opt.classList.add('pop');
      if (chosen.has(v)) sparkle(opt);
      save(); render();
    });

    form.addEventListener('input', (e) => {
      if (e.target.tagName !== 'TEXTAREA') return;
      const card = e.target.closest('.q-card');
      st.answers[card.dataset.q] = e.target.value;
      st.done = false;
      save(); render();
    });

    $('#q-next').addEventListener('click', () => { if (st.step < total - 1) { st.step++; save(); render(); window.scrollTo(0, 0); } });
    $('#q-back').addEventListener('click', () => { if (st.step > 0) { st.step--; save(); render(); window.scrollTo(0, 0); } });

    /* ----- kirim ke server -> tampilkan hasil ----- */
    async function sendToServer(saveOnServer) {
      const res = await fetch('/api/submit', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: st.answers, save: saveOnServer }),
      });
      if (res.status === 403) { window.BD.toast('Sesi habis. Masukkan password lagi ya.'); setTimeout(() => location.reload(), 1500); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.message || 'Jawaban belum bisa diproses.');
      $('#view-result').innerHTML = data.html;
      window.BD.showView('result');
      return true;
    }

    $('#q-send').addEventListener('click', async () => {
      const yes = await window.BD.confirm({
        title: 'Kirim jawabanmu?',
        text: 'Jawabanmu akan disimpan di website ini. Setelah itu kamu bisa menyalin atau mengunduh hasilnya untuk dikirim ke Adek lewat chat.',
        yes: 'Yes, send it',
        no: 'Wait, edit again',
      });
      if (!yes) return;
      $('#q-send').disabled = true;
      try {
        if (await sendToServer(true)) { st.done = true; save(); }
      } catch (err) {
        errBox.textContent = err.message;
      } finally {
        render();
      }
    });

    $('#btn-see-report').addEventListener('click', async () => {
      try { await sendToServer(false); } catch (err) { errBox.textContent = err.message; }
    });

    $('#q-reset').addEventListener('click', async () => {
      const yes = await window.BD.confirm({
        title: 'Mulai ulang kuis?',
        text: 'Semua jawaban yang sudah diisi akan dihapus dari kuis ini.',
        yes: 'Ya, ulang', no: 'Batal',
      });
      if (!yes) return;
      st = { answers: {}, step: 0, done: false };
      $$('textarea', form).forEach((t) => (t.value = ''));
      save(); render();
    });

    render();
  });

  /* ===== Halaman hasil ===== */
  function animateResult() {
    const num = $('#love-count');
    if (!num) return;
    const target = Number(num.dataset.target) || 100;
    const meter = $('.heart-meter');
    const bar = $('#meter-bar');
    const paint = (v) => { num.textContent = v; meter.style.setProperty('--p', v); bar.style.width = v + '%'; };
    if (window.BD.reduceMotion) { paint(target); return; }
    const t0 = performance.now();
    const dur = 2600;
    (function step(now) {
      const k = Math.min(1, (now - t0) / dur);
      paint(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  document.addEventListener('view:change', (e) => { if (e.detail.name === 'result') animateResult(); });

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* coba cara lama */ }
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { /* abaikan */ }
    ta.remove();
    return ok;
  }

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-result]');
    if (!b) return;
    const report = ($('#report-text') || {}).value || '';
    if (b.dataset.result === 'see') {
      const box = $('#answers-full');
      box.hidden = !box.hidden;
      b.textContent = box.hidden ? 'See my answers' : 'Hide my answers';
      if (!box.hidden) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (b.dataset.result === 'copy') {
      window.BD.toast((await copyText(report)) ? 'Love report tersalin. Tempel di chat ya.' : 'Gagal menyalin. Coba tombol Download.');
    } else if (b.dataset.result === 'download') {
      const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'love-report.txt';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
})();
