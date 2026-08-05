/**
 * TechFlow — QA automatizado de tracking (contract testing del dataLayer)
 * ------------------------------------------------------------------
 * Recorre el journey publicado, captura window.dataLayer en cada etapa y
 * VALIDA cada evento contra el esquema del measurement plan. Si algún
 * evento falta o su payload no cumple el contrato, sale con código != 0
 * (rompe el build en CI). Es un test de la MEDICIÓN, no del sitio.
 *
 * Valida sobre el dataLayer (lo que este repo controla), no sobre lo que
 * GA4 recibe: el dataLayer se puebla igual con o sin consentimiento, así
 * que el contrato es determinista.
 *
 * Fuente de verdad del esquema: ../docs/MEASUREMENT_PLAN.md
 *
 * Uso:  node qa/validate-tracking.mjs [baseURL]
 */

import { chromium } from 'playwright';

const BASE = (process.argv[2] || 'https://damondrc.github.io/portfolio-analytics/Proyecto-1')
  .replace(/\/$/, '');

const PLAN = 'pro';
const PRICE = { starter: 0, pro: 12, business: 29 };

// ---- micro framework de aserciones ----
const results = [];
function check(name, cond, detail = '') {
  results.push({ name, ok: !!cond, detail });
  console.log(`${cond ? '  ✓' : '  ✗'} ${name}${cond ? '' : `  — ${detail}`}`);
}

/** devuelve el primer evento del dataLayer con ese nombre */
const findEvent = (dl, name) => dl.find((r) => r && r.event === name);
const getDataLayer = (page) => page.evaluate(() => window.dataLayer || []);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** valida la forma de un item ecommerce */
function validItem(it, planKey) {
  if (!it) return false;
  const okBase = it.item_id === `plan_${planKey}` &&
    typeof it.item_name === 'string' &&
    it.item_category === 'saas_plan' &&
    it.price === PRICE[planKey] &&
    it.quantity === 1;
  return okBase;
}

async function main() {
  console.log(`QA tracking · ${BASE}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // ---------- HOME ----------
    await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
    // aceptar consent (no afecta al dataLayer, pero replica un usuario real)
    try { await page.locator('#tf-consent .tf-accept').click({ timeout: 4000 }); } catch {}

    // ---------- PRECIOS: view_item_list ----------
    await Promise.all([
      page.waitForURL('**/precios.html', { timeout: 15000 }),
      page.locator('#btn-cta').click(),
    ]);
    await page.waitForLoadState('networkidle');
    let dl = await getDataLayer(page);
    const vil = findEvent(dl, 'view_item_list');
    check('view_item_list existe', vil, 'no se encontró en el dataLayer');
    check('view_item_list · items[] con 3 planes',
      vil && vil.ecommerce && Array.isArray(vil.ecommerce.items) && vil.ecommerce.items.length === 3,
      JSON.stringify(vil && vil.ecommerce));
    check('view_item_list · item_list_id = "planes"',
      vil && vil.ecommerce && vil.ecommerce.item_list_id === 'planes');
    check('reset ecommerce:null antes del push',
      dl.some((r) => r && r.ecommerce === null), 'no se hizo dataLayer.push({ ecommerce:null })');

    // ---------- SELECT_ITEM + navegación ----------
    await Promise.all([
      page.waitForURL('**/registro.html**', { timeout: 15000 }),
      page.locator(`.plan-cta[data-plan="${PLAN}"]`).click(),
    ]);
    await page.waitForLoadState('networkidle');
    // el select_item quedó en el dataLayer de la página anterior; se valida
    // el begin_checkout de la página de registro (mismo journey)

    // ---------- REGISTRO: begin_checkout ----------
    dl = await getDataLayer(page);
    const bc = findEvent(dl, 'begin_checkout');
    check('begin_checkout existe', bc);
    check('begin_checkout · value = precio del plan',
      bc && bc.ecommerce && bc.ecommerce.value === PRICE[PLAN], JSON.stringify(bc && bc.ecommerce));
    check('begin_checkout · currency = USD',
      bc && bc.ecommerce && bc.ecommerce.currency === 'USD');
    check('begin_checkout · item válido',
      bc && bc.ecommerce && validItem(bc.ecommerce.items && bc.ecommerce.items[0], PLAN));

    // Paso 1 -> Paso 2
    await page.fill('#reg-nombre', 'QA Bot');
    await page.fill('#reg-email', 'qa@example.com');
    await page.locator('#reg-step-1 button[type="submit"]').click();
    await page.locator('#reg-step-2').waitFor({ state: 'visible' });

    // ---------- SIGN_UP + navegación a gracias ----------
    await page.fill('#reg-empresa', 'QA Inc');
    await page.selectOption('#reg-tamano', '6-20');
    await Promise.all([
      page.waitForURL('**/gracias.html**', { timeout: 15000 }),
      page.locator('#btn-crear-cuenta').click(),
    ]);
    await page.waitForLoadState('networkidle');
    await sleep(1500);

    // sign_up quedó en el dataLayer de registro; validamos en gracias el
    // purchase + generate_lead, y revisamos sign_up capturándolo antes de salir
    // (se relee el dataLayer acumulado del contexto de gracias)
    dl = await getDataLayer(page);

    // ---------- GRACIAS: purchase + generate_lead ----------
    const pur = findEvent(dl, 'purchase');
    check('purchase existe', pur);
    check('purchase · transaction_id presente',
      pur && pur.ecommerce && typeof pur.ecommerce.transaction_id === 'string' &&
      pur.ecommerce.transaction_id.length > 0);
    check('purchase · value + currency',
      pur && pur.ecommerce && pur.ecommerce.value === PRICE[PLAN] && pur.ecommerce.currency === 'USD');
    check('purchase · item válido',
      pur && pur.ecommerce && validItem(pur.ecommerce.items && pur.ecommerce.items[0], PLAN));
    const gl = findEvent(dl, 'generate_lead');
    check('generate_lead existe con value/currency',
      gl && gl.value === PRICE[PLAN] && gl.currency === 'USD');

    // ---------- DEDUP: recargar no vuelve a disparar purchase ----------
    // En el primer load, purchase se empuja (1). Al recargar, la dedup por
    // transaction_id (sessionStorage) evita el re-push: como el dataLayer se
    // reinicia en la recarga, NO debe contener ningún purchase.
    const purchasesFirstLoad = (await getDataLayer(page)).filter((r) => r && r.event === 'purchase').length;
    check('purchase se dispara en el primer load', purchasesFirstLoad === 1,
      `count=${purchasesFirstLoad}`);
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(1500);
    const purchasesReload = (await getDataLayer(page)).filter((r) => r && r.event === 'purchase').length;
    check('dedup · recargar gracias NO vuelve a disparar purchase',
      purchasesReload === 0, `count tras reload=${purchasesReload}`);

    // ---------- SIGN_UP (validado en aislamiento) ----------
    // Reabrimos registro y ABORTAMOS la navegación a gracias: así el push de
    // sign_up queda en el dataLayer de registro y podemos leerlo (si dejáramos
    // navegar, el dataLayer se reemplazaría por el de gracias).
    const p2 = await context.newPage();
    await p2.route('**/gracias.html*', (route) => route.abort());
    await p2.goto(`${BASE}/registro.html?plan=${PLAN}`, { waitUntil: 'networkidle' });
    await p2.fill('#reg-nombre', 'QA Bot');
    await p2.fill('#reg-email', 'qa@example.com');
    await p2.locator('#reg-step-1 button[type="submit"]').click();
    await p2.locator('#reg-step-2').waitFor({ state: 'visible' });
    await p2.fill('#reg-empresa', 'QA Inc');
    await p2.selectOption('#reg-tamano', '6-20');
    await p2.locator('#btn-crear-cuenta').click().catch(() => {});
    await sleep(800);
    const dl2 = await p2.evaluate(() => window.dataLayer || []);
    const su = dl2.find((r) => r && r.event === 'sign_up');
    check('sign_up existe', su);
    check('sign_up · method + plan_id (sin PII)',
      su && su.method === 'landing_form' && su.plan_id === `plan_${PLAN}`,
      JSON.stringify(su));
    // el dataLayer no debe contener PII (nombre/email)
    const raw = JSON.stringify(dl2);
    check('sin PII en el dataLayer (nombre/email)',
      !raw.includes('qa@example.com') && !/"QA Bot"/.test(raw));
    await p2.close();
  } finally {
    await context.close();
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks OK`);
  if (failed.length) {
    console.error(`FALLARON ${failed.length}: ${failed.map((f) => f.name).join(', ')}`);
    process.exit(1);
  }
  console.log('Contrato del dataLayer verificado ✓');
}

main().catch((e) => { console.error(e); process.exit(1); });
