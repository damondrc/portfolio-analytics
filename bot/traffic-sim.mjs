/**
 * TechFlow — Simulador de tráfico (generador de datos sintéticos)
 * ------------------------------------------------------------------
 * Recorre el journey real publicado en GitHub Pages con un navegador
 * headless (Playwright). Acepta el banner de Consent Mode v2 para que
 * los hits fluyan por el pipeline real GTM -> Consent -> GA4, igual
 * que un visitante humano. No usa Measurement Protocol: los eventos
 * son indistinguibles de tráfico orgánico salvo por el origen.
 *
 * Aleatoriedad: cada ejecución simula 1–2 sesiones. Cada sesión usa
 * un contexto nuevo (cliente/usuario GA4 distinto), elige un plan con
 * pesos, y a veces abandona el funnel en un punto aleatorio. Esto
 * produce un embudo con caídas naturales en lugar de conversiones 100%.
 *
 * Uso local:  node bot/traffic-sim.mjs
 * En CI:      lo dispara .github/workflows/traffic-sim.yml (cron diario)
 *
 * Es tráfico sintético sobre un sitio de portafolio propio y simulado.
 * Documentado como tal: no pretende representar engagement orgánico.
 */

import { chromium } from 'playwright';

const BASE = 'https://damondrc.github.io/portfolio-analytics/Proyecto-1';
const HOME = `${BASE}/index.html`;

// ---- utilidades de aleatoriedad ----
const rnd = (min, max) => Math.random() * (max - min) + min;
const rint = (min, max) => Math.floor(rnd(min, max + 1));
const chance = (p) => Math.random() < p;
const pick = (arr) => arr[rint(0, arr.length - 1)];

/** elige una clave según pesos {clave: peso} */
function weighted(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(weights)) {
    if ((r -= w) < 0) return k;
  }
  return Object.keys(weights)[0];
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
/** pausa "humana" entre acciones */
const dwell = () => sleep(rint(1200, 3500));

// Perfiles de navegador realistas (evita el UA "HeadlessChrome",
// que el filtro de bots de GA4 podría descartar).
const PROFILES = [
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', vw: 1366, vh: 768 },
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36', vw: 1536, vh: 864 },
  { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', vw: 1440, vh: 900 },
  { ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36', vw: 1280, vh: 720 },
];

const NOMBRES = ['Ana', 'Luis', 'Marta', 'Diego', 'Sara', 'Pablo', 'Elena', 'Iván', 'Nora', 'Hugo'];
const EMPRESAS = ['Nortada', 'Kuvio', 'Brightpath', 'Altiva', 'Datacraft', 'Milo Labs', 'Verda', 'Sento'];
const TAMANOS = ['1-5', '6-20', '21+'];

/** acepta (o a veces rechaza) el banner de consentimiento si aparece */
async function handleConsent(page, accept) {
  const sel = accept ? '#tf-consent .tf-accept' : '#tf-consent .tf-reject';
  try {
    const btn = page.locator(sel);
    await btn.waitFor({ state: 'visible', timeout: 4000 });
    await dwell();
    await btn.click();
  } catch {
    /* el banner no apareció (consent ya guardado en este contexto) */
  }
}

/** una sesión completa (un "usuario") */
async function runSession(browser, i) {
  const profile = pick(PROFILES);
  const context = await browser.newContext({
    userAgent: profile.ua,
    viewport: { width: profile.vw, height: profile.vh },
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  });
  const page = await context.newPage();

  // 15% rechaza el consentimiento (genera el escenario "denied" de la Fase E;
  // esos hits no llegan a GA4, igual que con un humano que rechaza).
  const acceptConsent = chance(0.85);

  // Perfil de recorrido de esta sesión
  const plan = weighted({ pro: 5, starter: 3, business: 2 });
  const goToPricing = chance(0.82);   // si no, rebota en la home
  const selectPlan = chance(0.75);    // avanza de precios a registro
  const finishStep1 = chance(0.72);   // completa el primer paso del registro
  const finishStep2 = chance(0.78);   // completa el registro -> gracias (purchase)

  const log = (msg) => console.log(`  [sesión ${i}] ${msg}`);

  try {
    log(`plan=${plan} consent=${acceptConsent ? 'accept' : 'reject'}`);

    // --- Home ---
    await page.goto(HOME, { waitUntil: 'networkidle', timeout: 30000 });
    await handleConsent(page, acceptConsent);
    await dwell();
    // scroll parcial para que scroll_50 dispare en algunas sesiones
    await page.mouse.wheel(0, rint(400, 1600));
    await dwell();

    if (!goToPricing) { log('rebota en home'); return; }

    // --- Precios (view_item_list) ---
    await Promise.all([
      page.waitForURL('**/precios.html', { timeout: 15000 }),
      page.locator('#btn-cta').click(),
    ]);
    await page.waitForLoadState('networkidle');
    await dwell();
    await page.mouse.wheel(0, rint(300, 1200));
    await dwell();

    if (!selectPlan) { log('abandona en precios'); return; }

    // --- Elegir plan (select_item) -> Registro (begin_checkout) ---
    await Promise.all([
      page.waitForURL('**/registro.html**', { timeout: 15000 }),
      page.locator(`.plan-cta[data-plan="${plan}"]`).click(),
    ]);
    await page.waitForLoadState('networkidle');
    await dwell();

    if (!finishStep1) { log('abandona en registro paso 1'); return; }

    // --- Registro paso 1 ---
    await page.fill('#reg-nombre', pick(NOMBRES));
    await page.fill('#reg-email', `demo${rint(100, 999)}@example.com`);
    await dwell();
    await page.locator('#reg-step-1 button[type="submit"]').click();
    await page.locator('#reg-step-2').waitFor({ state: 'visible', timeout: 8000 });
    await dwell();

    if (!finishStep2) { log('abandona en registro paso 2'); return; }

    // --- Registro paso 2 (sign_up) -> Gracias (purchase + generate_lead) ---
    await page.fill('#reg-empresa', pick(EMPRESAS));
    await page.selectOption('#reg-tamano', pick(TAMANOS));
    await dwell();
    await Promise.all([
      page.waitForURL('**/gracias.html**', { timeout: 15000 }),
      page.locator('#btn-crear-cuenta').click(),
    ]);
    await page.waitForLoadState('networkidle');
    // margen para que se envíe el purchase antes de cerrar
    await sleep(rint(3000, 5000));
    log(`CONVERSIÓN completa (plan ${plan})`);
  } catch (err) {
    log(`error: ${err.message}`);
  } finally {
    await context.close();
  }
}

async function main() {
  const sessions = rint(1, 2) + (chance(0.3) ? 1 : 0); // 1–3, sesgado a 1–2
  console.log(`TechFlow traffic-sim · ${new Date().toISOString()} · ${sessions} sesión(es)`);
  const browser = await chromium.launch({ headless: true });
  try {
    for (let i = 1; i <= sessions; i++) {
      await runSession(browser, i);
      if (i < sessions) await sleep(rint(4000, 9000));
    }
  } finally {
    await browser.close();
  }
  console.log('Listo.');
}

main().catch((e) => { console.error(e); process.exit(1); });
