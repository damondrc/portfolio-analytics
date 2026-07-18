/**
 * TechFlow — capa de tracking (dataLayer / GA4 ecommerce)
 * ------------------------------------------------------------------
 * Todos los eventos ecommerce siguen el esquema recomendado de GA4.
 * Regla: antes de cada push ecommerce se limpia el objeto con
 * dataLayer.push({ ecommerce: null }) para evitar arrastre de
 * parámetros entre eventos.
 *
 * Documentación: /docs/MEASUREMENT_PLAN.md (fuente de verdad).
 */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  // ---- Catálogo de planes (única fuente de precios) ----
  var PLANS = {
    starter: { item_id: 'plan_starter', item_name: 'Plan Starter', price: 0 },
    pro: { item_id: 'plan_pro', item_name: 'Plan Pro', price: 12 },
    business: { item_id: 'plan_business', item_name: 'Plan Business', price: 29 }
  };
  var CURRENCY = 'USD';
  var LIST = { item_list_id: 'planes', item_list_name: 'Página de precios' };

  function planItem(planKey) {
    var p = PLANS[planKey];
    if (!p) return null;
    return {
      item_id: p.item_id,
      item_name: p.item_name,
      item_category: 'saas_plan',
      price: p.price,
      quantity: 1
    };
  }

  function pushEcommerce(eventName, ecommerce, extra) {
    dataLayer.push({ ecommerce: null }); // limpiar objeto previo
    var payload = { event: eventName, ecommerce: ecommerce };
    if (extra) {
      for (var k in extra) { if (extra.hasOwnProperty(k)) payload[k] = extra[k]; }
    }
    dataLayer.push(payload);
  }

  function getParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  // API pública mínima usada por las páginas
  window.TFTracking = {

    /** precios.html: al cargar */
    viewPlans: function () {
      var items = ['starter', 'pro', 'business'].map(function (k) {
        var it = planItem(k);
        it.item_list_id = LIST.item_list_id;
        it.item_list_name = LIST.item_list_name;
        return it;
      });
      pushEcommerce('view_item_list', {
        item_list_id: LIST.item_list_id,
        item_list_name: LIST.item_list_name,
        items: items
      });
    },

    /** precios.html: clic en "Elegir plan" (antes de navegar) */
    selectPlan: function (planKey) {
      var it = planItem(planKey);
      if (!it) return;
      it.item_list_id = LIST.item_list_id;
      it.item_list_name = LIST.item_list_name;
      pushEcommerce('select_item', {
        item_list_id: LIST.item_list_id,
        item_list_name: LIST.item_list_name,
        items: [it]
      });
    },

    /** registro.html: al cargar con ?plan= */
    beginCheckout: function () {
      var planKey = getParam('plan') || 'pro';
      var it = planItem(planKey) || planItem('pro');
      pushEcommerce('begin_checkout', {
        currency: CURRENCY,
        value: it.price,
        items: [it]
      });
      return planKey in PLANS ? planKey : 'pro';
    },

    /** registro.html: formulario completado. Sin PII: solo el plan. */
    signUp: function (planKey) {
      dataLayer.push({
        event: 'sign_up',
        method: 'landing_form',
        plan_id: (PLANS[planKey] || PLANS.pro).item_id
      });
    },

    /**
     * gracias.html: purchase simulado + generate_lead.
     * Deduplicación: el transaction_id viene en la URL y se marca en
     * sessionStorage; recargar la página no vuelve a disparar purchase.
     */
    conversion: function () {
      var planKey = getParam('plan') || 'pro';
      var tid = getParam('tid');
      var it = planItem(planKey) || planItem('pro');
      if (!tid) return;

      var seenKey = 'tf_purchase_' + tid;
      var seen = false;
      try { seen = !!sessionStorage.getItem(seenKey); } catch (e) {}
      if (seen) return;

      pushEcommerce('purchase', {
        transaction_id: tid,
        currency: CURRENCY,
        value: it.price,
        items: [it]
      });
      dataLayer.push({
        event: 'generate_lead',
        currency: CURRENCY,
        value: it.price
      });
      try { sessionStorage.setItem(seenKey, '1'); } catch (e) {}
    },

    /** registro.html: genera un transaction_id simulado */
    newTransactionId: function () {
      return 'T-' + Date.now().toString(36).toUpperCase();
    },

    plans: PLANS
  };
})();
