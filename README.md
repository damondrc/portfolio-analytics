# Digital Analytics Portfolio — GTM & GA4

End-to-end web tracking implementation on a simulated SaaS site (TechFlow),
deployed with GitHub Pages: measurement planning, GA4 ecommerce events,
Consent Mode v2, GTM governance and documented debugging.

> 🌐 **Live site:** https://damondrc.github.io/portfolio-analytics
> 🎯 **Instrumented demo (full journey):** [TechFlow](https://damondrc.github.io/portfolio-analytics/Proyecto-1/index.html)
> 📋 **Measurement Plan:** [docs/MEASUREMENT_PLAN.md](docs/MEASUREMENT_PLAN.md)

## The measured journey

```
Home → Precios → Registro (2 pasos) → Gracias
        │            │                  │
 view_item_list   begin_checkout     purchase (simulated, deduplicated)
 select_item      sign_up            generate_lead
```

Built on GA4 recommended events with a full `items[]` ecommerce schema, plus
the original legacy events (`click_cta`, `form_submit`, `scroll_50`,
`click_proyecto_1/2/3`) kept for historical continuity.

## What's inside

**[1 — Instrumented site: GTM + GA4 ecommerce journey](https://damondrc.github.io/portfolio-analytics/Proyecto-1/index.html)**
Multi-page simulated SaaS with a complete acquisition funnel wired through the
dataLayer: pricing list impressions, plan selection, two-step signup and a
deduplicated simulated purchase. Consent Mode v2 with a functional banner
(defaults denied, update on choice, persisted). The pages are built out like a
real product site — illustrated hero, social proof, product tour, comparison
table, testimonials and FAQ — so engagement signals like scroll depth reflect
genuine interaction rather than firing on a one-screen page.

**[2 — GA4: key events, custom dimensions & funnel](https://damondrc.github.io/portfolio-analytics/Proyecto-2/)**
GA4 property configuration: key events, event-scoped custom dimensions
(`plan_id`) and the acquisition funnel built in Explorations.

**[3 — Documented debugging](https://damondrc.github.io/portfolio-analytics/Proyecto-3/README.md)**
Real errors found during implementation — including a duplicate gtag.js + GTM
installation double-counting page_views — each with diagnosis, fix and
validation via GTM Preview Mode and GA4 DebugView.

## Keeping the demo populated

[`bot/`](bot/) — a **synthetic traffic simulator** (Playwright + GitHub
Actions) that walks the real published journey once a day, accepting the
consent banner so hits flow through the actual GTM → Consent → GA4 pipeline.
It randomizes plan choice, consent and abandon point to produce a funnel with
realistic drop-off. It's synthetic traffic on a demo site, documented as such —
its purpose is to prove the measurement pipeline captures a full funnel end to
end without relying on manual visits.

## Docs

- [Measurement Plan](docs/MEASUREMENT_PLAN.md) — objectives → KPIs → event
  dictionary → parameters → consent. Single source of truth.
- [GTM Governance](docs/GTM_GOVERNANCE.md) — naming conventions, folders,
  versioning, QA checklist.
- [GTM Setup Guide](docs/GTM_SETUP_GUIDE.md) — container configuration steps
  matched to each release phase.
- [Traffic simulator](bot/README.md) — how the synthetic-traffic bot works.
- [`gtm/`](gtm/) — versioned container exports.

## Stack

Google Tag Manager · Google Analytics 4 · Consent Mode v2 · dataLayer /
ecommerce schema · GA4 Explorations (funnel) · Playwright · GitHub Actions ·
HTML/CSS/JS · GitHub Pages

## Roadmap

- Server-side tagging (sGTM) — documented as next step; requires cloud
  infrastructure (Cloud Run / Stape), out of scope for a static demo.
- BigQuery export of the GA4 property for SQL analysis.

## This property feeds my other projects

The GA4 property instrumented here is a living data source — the rest of my
portfolio builds on what it collects:

- **[ecommerce-funnel-analysis](https://github.com/damondrc/ecommerce-funnel-analysis)** —
  funnel analysis with SQL + Tableau on GA4-style event data (simulated at scale).
- **[ga4-reporting-automation](https://github.com/damondrc/ga4-reporting-automation)** —
  automated weekly reporting pulling **this property's real data** via the GA4
  Data API and GitHub Actions. Event additions here are propagated additively
  to its queries (legacy event names are never renamed).

*Collection → Analysis → Activation.*
