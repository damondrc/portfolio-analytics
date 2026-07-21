# Measurement Plan — TechFlow (Simulated SaaS)

**Version:** 1.1 · **Owner:** Damond Rivera · **Last updated:** 2026-07
**Property:** GA4 `G-HV1S1BRJ8S` · **Container:** GTM `GTM-NHRCHKWS`
**Environment:** GitHub Pages (static) · Consent Mode v2 enabled

This document is the single source of truth for what is measured on this site,
why, and how. Any change to tracking must be reflected here **before** it is
implemented (plan → implement → QA → release).

---

## 1. Business context & objectives

TechFlow is a simulated B2B SaaS (project management tool) with a free-trial
acquisition model. The measurement design mirrors what a real SaaS of this type
would need.

| Business objective | Question answered | KPI |
|---|---|---|
| Acquire trial signups | How many visitors start a trial? | Signup conversion rate |
| Understand plan preference | Which plan attracts the most interest? | `select_item` share by plan |
| Optimize the signup flow | Where do users abandon the flow? | Funnel step completion % |
| Qualify demand | How engaged are visitors before converting? | Scroll 50% rate, CTA CTR |

## 2. User journey & funnel

```
Home (index.html)
  └─ CTA "Empieza gratis"        → click_cta (legacy, kept)
Precios (precios.html)
  └─ page load                   → view_item_list
  └─ click "Elegir plan"         → select_item
Registro (registro.html?plan=X)
  └─ page load                   → begin_checkout
  └─ form completed              → sign_up
Gracias (gracias.html)
  └─ page load (deduplicated)    → purchase (simulated) + generate_lead
```

Primary funnel (GA4 Exploration): `view_item_list → select_item →
begin_checkout → sign_up → purchase`.

## 3. Event dictionary

### 3.1 Legacy events (KEPT — do not rename or remove)

These events pre-date v1.0 of this plan. They remain active to preserve
historical continuity in the GA4 property and downstream reporting
([ga4-reporting-automation](https://github.com/damondrc/ga4-reporting-automation)
queries this property by event name).

| Event | Trigger (GTM) | Page |
|---|---|---|
| `click_cta` | Click on `#btn-cta` | Home |
| `form_submit` | Submit of `#signup-form` | Home |
| `scroll_50` | Scroll depth ≥ 50% | Home |
| `click_proyecto_1/2/3` | Click on portfolio cards | Portfolio landing |

### 3.2 Ecommerce / recommended events (v1.0)

All pushed via `dataLayer.push()` from `Proyecto-1/js/tracking.js`, using GA4
recommended-event schema. Every ecommerce push is preceded by
`dataLayer.push({ ecommerce: null })` to prevent parameter bleed between events.

| Event | Fired when | Key parameters |
|---|---|---|
| `view_item_list` | Pricing page loads | `ecommerce.item_list_id="planes"`, `items[]` (3 plans) |
| `select_item` | Click "Elegir plan" | `items[]` (chosen plan) |
| `begin_checkout` | Signup page loads with a plan | `ecommerce.value`, `currency`, `items[]` |
| `sign_up` | Signup form completed | `method="landing_form"`, `plan_id` |
| `purchase` | Thank-you page loads (once per `transaction_id`) | `transaction_id`, `value`, `currency="USD"`, `items[]` |
| `generate_lead` | Thank-you page loads | `value`, `currency` |

### 3.3 `items[]` schema

| Field | Example | Notes |
|---|---|---|
| `item_id` | `plan_pro` | Stable ID, snake_case |
| `item_name` | `Plan Pro` | Display name |
| `item_category` | `saas_plan` | Fixed |
| `price` | `12` | USD, monthly |
| `quantity` | `1` | Always 1 |

Plans: `plan_starter` ($0) · `plan_pro` ($12) · `plan_business` ($29).
The `purchase` for the free Starter plan carries `value: 0` — intentional, to
show the full schema works regardless of monetary value.

### 3.4 Custom parameters → GA4 custom dimensions

These must be registered in GA4 (Admin → Custom definitions) to be reportable:

| Parameter | Scope | Used in |
|---|---|---|
| `plan_id` | Event | `sign_up` |
| `signup_step` | Event | future step-level tracking |

## 4. Naming conventions

- **Events:** `snake_case`, verb_noun where possible. GA4 recommended names
  are used verbatim when one exists — never invent a synonym for a standard event.
- **Parameters:** `snake_case`, no PII ever (no names, emails, phone numbers).
- **GTM assets:** see [GTM_GOVERNANCE.md](GTM_GOVERNANCE.md).

## 5. Consent

Consent Mode v2 is active. Defaults are `denied` for all four signals
(`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`) and
are set **before** GTM loads. The banner (`/js/consent.js`) updates consent on
user choice and persists it in `localStorage`. Expected effect: reported users
and events under-count real traffic; this is documented for downstream
reporting.

## 6. Key events (conversions) in GA4

Marked as key events: `sign_up`, `purchase`, `generate_lead`, plus legacy
`form_submit`.

## 7. Data generation

To keep the funnel populated without relying on manual visits, a synthetic
traffic simulator ([`bot/`](../bot/), Playwright + GitHub Actions) walks the
published journey daily. It accepts the consent banner so events flow through
the real GTM → Consent → GA4 pipeline, and randomizes plan choice, consent and
abandon point to reproduce realistic drop-off. This is synthetic traffic on a
demo property, documented as such; it does not represent organic engagement.

## 8. Change log

| Version | Date | Change |
|---|---|---|
| 1.1 | 2026-07 | Corrected legacy scroll event name to `scroll_50` (matches the container). Expanded the site pages so scroll depth reflects real engagement. Added the synthetic traffic simulator as data source (§7). |
| 1.0 | 2026-07 | Initial plan. Multi-page journey, ecommerce schema, Consent Mode v2, removal of duplicate gtag.js install (see Proyecto-3, Bug #4). |
