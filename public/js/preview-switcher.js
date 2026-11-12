/* Preview switcher: moves the lead form between four candidate positions (A-D). Prototype-only. */
(function () {
  'use strict';

  var form = document.getElementById('daftar');
  var main = document.querySelector('main');
  if (!form || !main) return;

  var OPTIONS = {
    a: {
      label: 'A', title: 'Setelah FAQ, sebelum CTA penutup',
      why: 'Form meminta 8 isian dan link CV, jadi paling wajar diminta setelah pengunjung melihat harga, garansi, dan keberatan umum yang dijawab FAQ.',
      pro: 'Niat pengunjung sudah matang, sehingga form terasa masuk akal.',
      con: 'Pengunjung yang siap daftar harus scroll jauh. Tombol "Daftar" sudah diarahkan langsung ke form untuk menutup celah ini.',
    },
    b: {
      label: 'B', title: 'Setelah Harga, sebelum FAQ',
      why: 'Ini titik niat tertinggi: pengunjung baru saja melihat harga dan garansi refund 100%, jadi form hanya satu scroll dari keputusan.',
      pro: 'Jalur dari harga ke form paling pendek.',
      con: 'Keberatan di FAQ belum terjawab, dan form yang panjang memutus alur menuju FAQ.',
    },
    c: {
      label: 'C', title: 'Tepat di bawah Hero',
      why: 'Form langsung terlihat tanpa scroll jauh. Cocok untuk pengunjung dari iklan atau rekomendasi yang sudah yakin sebelum datang.',
      pro: 'Paling mudah ditemukan, terutama di mobile (halaman ±11.500px).',
      con: 'Meminta CV dan data karier sebelum pengunjung tahu isi programnya. Berisiko untuk program Rp15-22 juta.',
    },
    d: {
      label: 'D', title: 'Menggantikan CTA penutup',
      why: 'Halaman cukup punya satu penutup. Form di band teal membawa pesan "Tanpa Risiko" sekaligus menjadi langkah aksi, tanpa dua ajakan yang bersaing.',
      pro: 'Halaman lebih ringkas, dan pesan garansi tetap berdampingan dengan form.',
      con: 'Mengganti section asli dan menghilangkan jalur "Konsultasi Sekarang" di penutup.',
    },
  };
  var DEFAULT = 'a';

  // Original sections of the reference page, in order: hero, logos, problems, tracks, steps, strategy, pricing, faq, final CTA.
  var sections = [].slice.call(main.children).filter(function (el) { return el.tagName === 'SECTION' && el !== form; });
  var FAQ = sections[7];
  var PRICING = sections[6];
  var LOGOS = sections[1];
  var CTA = sections[8];
  if (!FAQ || !CTA || !LOGOS || !PRICING) return;

  var params = new URLSearchParams(location.search);
  var requested = (params.get('opsi') || '').toLowerCase();

  // ?opsi=off shows the untouched reference page (no form, no switcher).
  if (requested === 'off') {
    form.remove();
    return;
  }

  var current = null;

  function place(key) {
    if (!OPTIONS[key]) key = DEFAULT;
    var anchor = key === 'b' ? FAQ : key === 'c' ? LOGOS : CTA;
    anchor.parentNode.insertBefore(form, anchor);
    form.hidden = false;
    form.dataset.skin = key === 'd' ? 'band' : 'card';
    CTA.style.display = key === 'd' ? 'none' : '';
    current = key;
    syncUi();
  }

  /* ---------- switcher UI ---------- */
  var bar = document.createElement('div');
  bar.className = 'lfp';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Preview posisi form pendaftaran');
  bar.innerHTML =
    '<div class="lfp-row"><span class="lfp-label">Posisi form</span>' +
    Object.keys(OPTIONS).map(function (k) {
      return '<button type="button" class="lfp-btn" data-opt="' + k + '" aria-pressed="false" aria-label="Opsi ' + OPTIONS[k].label + '">' + OPTIONS[k].label + '</button>';
    }).join('') +
    '<button type="button" class="lfp-btn lfp-off" data-opt="off" aria-label="Sembunyikan form, tampilkan halaman asli">Asli</button>' +
    '<button type="button" class="lfp-btn lfp-toggle" data-toggle aria-expanded="true" aria-controls="lfp-cap" aria-label="Tampilkan atau sembunyikan alasan">Alasan</button></div>' +
    '<div class="lfp-cap" id="lfp-cap" aria-live="polite"></div>';
  document.body.appendChild(bar);
  document.body.classList.add('lf-preview');
  var cap = bar.querySelector('.lfp-cap');
  var toggle = bar.querySelector('[data-toggle]');

  // Reasoning panel: open by default on desktop, closed on phones so it never covers the form.
  function setCapOpen(open) {
    cap.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }
  setCapOpen(window.matchMedia('(min-width: 768px)').matches);
  toggle.addEventListener('click', function () { setCapOpen(cap.hidden); });

  function syncUi() {
    [].slice.call(bar.querySelectorAll('[data-opt]')).forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-opt') === current));
    });
    var o = OPTIONS[current];
    cap.innerHTML =
      '<p class="lfp-title">Opsi ' + o.label + ': ' + o.title + '</p>' +
      '<p><span class="lfp-tag">Alasan</span>' + o.why + '</p>' +
      '<p><span class="lfp-tag lfp-tag--pro">Kelebihan</span>' + o.pro + '</p>' +
      '<p><span class="lfp-tag lfp-tag--con">Pertimbangan</span>' + o.con + '</p>';
    var u = new URL(location.href);
    u.searchParams.set('opsi', current);
    history.replaceState(null, '', u);
  }

  function scrollToForm() {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(function () {
      if (window.__leadForm) window.__leadForm.focusFirst();
    }, 600);
  }

  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-opt]');
    if (!b) return;
    var k = b.getAttribute('data-opt');
    if (k === 'off') {
      var u = new URL(location.href);
      u.searchParams.set('opsi', 'off');
      location.href = u.toString();
      return;
    }
    place(k);
    window.requestAnimationFrame(scrollToForm);
  });

  /* ---------- route "daftar" CTAs to the form; "konsultasi" CTAs stay on WhatsApp ---------- */
  var REGISTER_LABELS = ['Ikuti Seleksi Program', 'Daftar Sekarang'];
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a, button');
    if (!el || form.contains(el) || bar.contains(el)) return;
    var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (REGISTER_LABELS.indexOf(text) === -1) return;
    e.preventDefault();
    e.stopPropagation();
    scrollToForm();
  }, true);

  place(OPTIONS[requested] ? requested : DEFAULT);
  if (OPTIONS[requested]) window.setTimeout(scrollToForm, 400);
})();
