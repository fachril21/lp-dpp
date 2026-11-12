/* Vanilla re-implementation of the interactions that the reference site hydrates with React islands. */
(function () {
  'use strict';

  /* ---------- AOS (scroll reveal) ---------- */
  function initAos() {
    if (window.AOS) window.AOS.init({ duration: 800, easing: 'ease', once: true });
  }

  /* ---------- Navbar: mobile menu + scroll state ---------- */
  function initNavbar() {
    var nav = document.getElementById('navbar');
    if (!nav) return;
    var mobile = nav.querySelector('.block.lg\\:hidden');
    if (!mobile) return;
    var overlay = mobile.querySelector('.invisible, .visible');
    var burger = mobile.firstElementChild && mobile.firstElementChild.firstElementChild;
    if (!overlay || !burger) return;

    function setOpen(open) {
      overlay.classList.toggle('invisible', !open);
      overlay.classList.toggle('opacity-0', !open);
      overlay.classList.toggle('visible', open);
      overlay.classList.toggle('opacity-100', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.style.cursor = 'pointer';
    burger.addEventListener('click', function () { setOpen(true); });
    var close = overlay.querySelector('.justify-between.mb-5 > div:last-child');
    if (close) {
      close.style.cursor = 'pointer';
      close.addEventListener('click', function () { setOpen(false); });
    }
  }

  /* ---------- FAQ accordion (single open) ---------- */
  var ICON_PLUS =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>';
  var ICON_MINUS =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus"><line x1="5" x2="19" y1="12" y2="12"></line></svg>';

  function setFaq(btn, open) {
    btn.setAttribute('aria-expanded', String(open));
    var iconBox = btn.querySelector('div');
    if (iconBox) iconBox.innerHTML = open ? ICON_MINUS : ICON_PLUS;
    var panel = btn.nextElementSibling;
    if (!panel) return;
    panel.style.gridTemplateRows = open ? '1fr' : '0fr';
    var divider = panel.querySelector('div > div > div');
    var answer = panel.querySelector('.faq-answer');
    if (divider) divider.style.opacity = open ? '1' : '0';
    if (answer) {
      answer.style.opacity = open ? '1' : '0';
      answer.style.transition = open ? 'opacity 300ms ease-in-out 100ms' : 'opacity 300ms ease-in-out';
    }
  }

  function initFaq(e) {
    var btn = e.target.closest('button[aria-expanded]');
    if (!btn) return;
    var willOpen = btn.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('button[aria-expanded]').forEach(function (b) {
      if (b !== btn) setFaq(b, false);
    });
    setFaq(btn, willOpen);
  }

  /* ---------- Pricing tabs (Bayar Penuh / Cicilan) ---------- */
  var pricingFull = null;
  function swapPricing(mode) {
    var section = document.getElementById('pricing-section');
    var tpl = document.getElementById('pricing-cicil');
    if (!section || !tpl) return;
    if (!pricingFull) pricingFull = section.outerHTML;
    var html = mode === 'cicil' ? tpl.innerHTML : pricingFull;
    var wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    var next = wrap.firstElementChild;
    next.querySelectorAll('[data-aos]').forEach(function (el) { el.classList.add('aos-init', 'aos-animate'); });
    section.replaceWith(next);
  }

  function onClick(e) {
    var tab = e.target.closest('button[role="tab"]');
    if (tab) {
      var tabs = [].slice.call(tab.parentElement.querySelectorAll('button[role="tab"]'));
      var mode = tabs.indexOf(tab) === 1 ? 'cicil' : 'full';
      if (tab.getAttribute('aria-selected') !== 'true') swapPricing(mode);
      return;
    }
    var arrow = e.target.closest('button[aria-label="Scroll left"], button[aria-label="Scroll right"]');
    if (arrow) {
      var host = arrow.closest('section') || document;
      var scroller = host.querySelector('.hide-scrollbar');
      var scrollers = [].slice.call(host.querySelectorAll('.hide-scrollbar'));
      var pairs = [].slice.call(host.querySelectorAll('button[aria-label="Scroll left"]'));
      var group = arrow.parentElement;
      var idx = 0;
      pairs.forEach(function (p, i) { if (p.parentElement === group) idx = i; });
      scroller = scrollers[idx] || scroller;
      if (!scroller) return;
      var card = scroller.firstElementChild;
      var step = card ? card.getBoundingClientRect().width + 16 : scroller.clientWidth * 0.8;
      scroller.scrollBy({ left: arrow.getAttribute('aria-label') === 'Scroll left' ? -step : step, behavior: 'smooth' });
      return;
    }
    initFaq(e);
  }

  /* ---------- Cookie banner ---------- */
  function initCookie() {
    var banner = document.querySelector('astro-island[component-url*="CookieConsent"]');
    if (!banner) return;
    var KEY = 'dpp-cookie-consent';
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (_) {}
    if (stored) { banner.remove(); return; }
    banner.querySelectorAll('button').forEach(function (b, i) {
      b.addEventListener('click', function () {
        try { localStorage.setItem(KEY, i === 0 ? 'reject' : 'accept'); } catch (_) {}
        banner.remove();
      });
    });
  }

  document.addEventListener('click', onClick);
  document.addEventListener('DOMContentLoaded', function () {
    initAos();
    initNavbar();
    initCookie();
  });
  if (document.readyState !== 'loading') {
    initAos();
    initNavbar();
    initCookie();
  }
})();
