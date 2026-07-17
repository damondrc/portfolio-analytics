/**
 * Consent Mode v2 — banner de consentimiento
 * ------------------------------------------------------------------
 * Requisito: cada página debe definir los DEFAULTS de consentimiento
 * (denied) en un <script> inline ANTES del snippet de GTM. Este archivo
 * solo gestiona el banner y el consent UPDATE.
 *
 * Persistencia: localStorage ('tf_consent' = 'granted' | 'denied').
 * Sin PII: no se guarda ningún dato del usuario, solo su elección.
 */
(function () {
  'use strict';

  var KEY = 'tf_consent';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }

  function applyConsent(state) {
    gtag('consent', 'update', {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state
    });
    // Evento propio para poder auditar la elección en GTM Preview
    dataLayer.push({ event: 'consent_' + state });
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* modo privado */ }

  if (saved === 'granted' || saved === 'denied') {
    applyConsent(saved);
    return; // ya eligió: no mostrar banner
  }

  // ---- Banner ----
  var css = [
    '#tf-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;',
    'background:#1a1a1a;color:#fff;padding:18px 20px;display:flex;',
    'flex-wrap:wrap;gap:14px;align-items:center;justify-content:center;',
    'font-family:"Segoe UI",sans-serif;font-size:.9rem;line-height:1.5;',
    'box-shadow:0 -2px 12px rgba(0,0,0,.25)}',
    '#tf-consent p{margin:0;max-width:560px}',
    '#tf-consent a{color:#9ec1ff}',
    '#tf-consent button{border:0;border-radius:6px;padding:10px 20px;',
    'font-size:.9rem;font-weight:600;cursor:pointer}',
    '#tf-consent .tf-accept{background:#0f62fe;color:#fff}',
    '#tf-consent .tf-reject{background:transparent;color:#ccc;',
    'border:1px solid #555}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var banner = document.createElement('div');
  banner.id = 'tf-consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Preferencias de cookies');
  banner.innerHTML =
    '<p>Usamos cookies de analítica (Google Analytics 4) para entender cómo ' +
    'se usa este sitio de portafolio. Puedes aceptarlas o rechazarlas; el ' +
    'sitio funciona igual en ambos casos.</p>' +
    '<button class="tf-reject" type="button">Rechazar</button>' +
    '<button class="tf-accept" type="button">Aceptar</button>';

  function choose(state) {
    try { localStorage.setItem(KEY, state); } catch (e) {}
    applyConsent(state);
    banner.remove();
  }

  banner.querySelector('.tf-accept').addEventListener('click', function () { choose('granted'); });
  banner.querySelector('.tf-reject').addEventListener('click', function () { choose('denied'); });

  if (document.body) {
    document.body.appendChild(banner);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.appendChild(banner);
    });
  }
})();
