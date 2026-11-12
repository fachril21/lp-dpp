/* Multi-step lead form -> prefilled WhatsApp message. Prototype only: nothing is stored. */
(function () {
  'use strict';

  var WA_PHONE = '6281227741541';
  var root = document.getElementById('daftar');
  if (!root) return;

  var form = root.querySelector('.lf-form');
  var panels = [].slice.call(root.querySelectorAll('.lf-panel'));
  var inds = [].slice.call(root.querySelectorAll('.lf-stepind'));
  var btnBack = root.querySelector('[data-act="back"]');
  var btnNext = root.querySelector('[data-act="next"]');
  var btnSubmit = root.querySelector('[data-act="submit"]');
  var done = root.querySelector('.lf-done');
  var step = 1;

  /* ---------- helpers ---------- */
  function val(name) {
    var el = form.elements[name];
    return el ? String(el.value || '').trim() : '';
  }
  function radio(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function normalizeWa(raw) {
    var d = String(raw).replace(/\D/g, '');
    if (d.indexOf('62') === 0) d = d.slice(2);
    else if (d.charAt(0) === '0') d = d.slice(1);
    return d ? '62' + d : '';
  }
  function validWa(norm) {
    // 62 + 8xx..., 10-15 digits in total
    return /^628\d{7,12}$/.test(norm);
  }
  function validDrive(url) {
    try {
      var u = new URL(url);
      return u.protocol === 'https:' && /^(drive|docs)\.google\.com$/.test(u.hostname);
    } catch (e) {
      return false;
    }
  }

  /* ---------- errors ---------- */
  function fieldEl(name) { return form.querySelector('[data-field="' + name + '"]'); }
  function setError(name, msg) {
    var f = fieldEl(name);
    if (!f) return;
    var err = f.querySelector('.lf-error');
    var input = f.querySelector('.lf-input:not([name="goalOther"])') || null;
    if (msg) {
      err.textContent = msg;
      err.hidden = false;
      err.setAttribute('role', 'alert');
      f.setAttribute('data-invalid', '');
      if (input) input.setAttribute('aria-invalid', 'true');
      if (f.getAttribute('role') === 'radiogroup') f.setAttribute('aria-invalid', 'true');
    } else {
      err.hidden = true;
      err.textContent = '';
      f.removeAttribute('data-invalid');
      f.removeAttribute('aria-invalid');
      if (input) input.removeAttribute('aria-invalid');
      var other = f.querySelector('[name="goalOther"]');
      if (other) other.removeAttribute('aria-invalid');
    }
  }

  var rules = {
    1: [
      ['name', function () {
        var v = val('name');
        if (!v) return 'Nama lengkap wajib diisi.';
        if (v.length < 3) return 'Tulis nama lengkapmu minimal 3 karakter.';
        return '';
      }],
      ['wa', function () {
        var v = val('wa');
        if (!v) return 'Nomor WhatsApp wajib diisi.';
        if (!validWa(normalizeWa(v))) return 'Nomor belum valid. Gunakan nomor Indonesia, contoh: 0812 3456 7890.';
        return '';
      }],
    ],
    2: [
      ['age', function () { return radio('age') ? '' : 'Pilih salah satu rentang usia.'; }],
      ['job', function () { return val('job') ? '' : 'Pekerjaanmu saat ini wajib diisi. Jika belum bekerja, tulis "Belum bekerja".'; }],
      ['exp', function () { return radio('exp') ? '' : 'Pilih lama pengalaman kerjamu.'; }],
      ['target', function () { return val('target') ? '' : 'Tulis posisi atau jabatan yang ingin kamu capai.'; }],
      ['goal', function () {
        var g = radio('goal');
        if (!g) return 'Pilih salah satu tujuanmu.';
        if (g === 'Lainnya' && !val('goalOther')) return 'Tuliskan tujuan lainmu pada kolom di bawah.';
        return '';
      }],
    ],
    3: [
      ['cv', function () {
        var v = val('cv');
        if (!v) return 'Link CV / resume wajib diisi.';
        if (!validDrive(v)) return 'Gunakan link Google Drive (drive.google.com atau docs.google.com) yang diawali https://.';
        return '';
      }],
    ],
  };

  /** Validate the given step. Returns the first invalid field element, or null. */
  function validate(n) {
    var first = null;
    rules[n].forEach(function (r) {
      var msg = r[1]();
      setError(r[0], msg);
      if (msg && !first) first = fieldEl(r[0]);
    });
    return first;
  }

  function focusField(f) {
    if (!f) return;
    var target = f.querySelector('.lf-input:not([name="goalOther"])') || f.querySelector('input:checked') || f.querySelector('input');
    if (f.getAttribute('data-field') === 'goal' && radio('goal') === 'Lainnya') target = f.querySelector('[name="goalOther"]');
    if (target) target.focus({ preventScroll: true });
    f.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* ---------- navigation ---------- */
  function go(n, opts) {
    opts = opts || {};
    step = n;
    panels.forEach(function (p) { p.hidden = Number(p.getAttribute('data-step')) !== n; });
    inds.forEach(function (li, i) {
      var idx = i + 1;
      li.classList.toggle('is-current', idx === n);
      li.classList.toggle('is-done', idx < n);
      if (idx === n) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    btnBack.hidden = n === 1;
    btnNext.hidden = n === 3;
    btnSubmit.hidden = n !== 3;
    if (!opts.silent) {
      var h = panels[n - 1].querySelector('.lf-h');
      if (h) h.focus({ preventScroll: true });
      var top = root.querySelector('.lf-card').getBoundingClientRect().top;
      if (top < 80) root.querySelector('.lf-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function next() {
    var bad = validate(step);
    if (bad) return focusField(bad);
    if (step < 3) go(step + 1);
  }

  /* ---------- WhatsApp message ---------- */
  function buildMessage() {
    var goal = radio('goal');
    if (goal === 'Lainnya') goal = 'Lainnya: ' + val('goalOther');
    var lines = [
      'Halo, Tim Dibimbing! Saya ingin mendaftar Dibimbing Placement Program (DPP).',
      '',
      '*Nama lengkap:* ' + val('name'),
      '*WhatsApp:* +' + normalizeWa(val('wa')),
      '*Usia:* ' + radio('age'),
      '*Pekerjaan saat ini:* ' + val('job'),
      '*Pengalaman kerja:* ' + radio('exp'),
      '*Posisi yang dituju:* ' + val('target'),
      '*Tujuan mengikuti DPP:* ' + goal,
      '*Link CV/Resume:* ' + val('cv'),
    ];
    return lines.join('\n');
  }
  function waUrl() {
    return 'https://api.whatsapp.com/send?phone=' + WA_PHONE + '&text=' + encodeURIComponent(buildMessage());
  }

  function submit() {
    for (var n = 1; n <= 3; n++) {
      var bad = validate(n);
      if (bad) {
        go(n, { silent: true });
        return focusField(bad);
      }
    }
    var url = waUrl();
    root.querySelector('[data-done-name]').textContent = val('name').split(/\s+/)[0] || 'kamu';
    root.querySelector('[data-done-link]').setAttribute('href', url);
    form.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
    window.open(url, '_blank', 'noopener');
  }

  function reset() {
    form.reset();
    root.querySelectorAll('.lf-field').forEach(function (f) { setError(f.getAttribute('data-field'), ''); });
    root.querySelector('.lf-other').hidden = true;
    done.hidden = true;
    form.hidden = false;
    go(1);
  }

  /* ---------- events ---------- */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'next') next();
    else if (act === 'back') go(step - 1);
    else if (act === 'reset') reset();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (step === 3) submit();
    else next();
  });

  // Clear an error as soon as the field is touched.
  form.addEventListener('input', function (e) {
    var f = e.target.closest('.lf-field');
    if (f && f.hasAttribute('data-invalid')) setError(f.getAttribute('data-field'), '');
  });
  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'goal') {
      var other = root.querySelector('.lf-other');
      other.hidden = t.value !== 'Lainnya';
      if (!other.hidden) other.querySelector('input').focus({ preventScroll: true });
    }
    var f = t.closest('.lf-field');
    if (f && f.hasAttribute('data-invalid') && t.type === 'radio') setError(f.getAttribute('data-field'), '');
  });

  // Tidy the WhatsApp number once the user leaves the field.
  form.elements.wa.addEventListener('blur', function () {
    var n = normalizeWa(this.value);
    if (validWa(n)) this.value = '+' + n.replace(/^(\d{2})(\d{3,4})(\d{3,4})(\d*)$/, '$1 $2 $3 $4').trim();
  });

  go(1, { silent: true });

  // Exposed for the preview switcher.
  window.__leadForm = {
    focusFirst: function () {
      var el = root.querySelector('.lf-panel:not([hidden]) .lf-input');
      if (el) el.focus({ preventScroll: true });
    },
  };
})();
