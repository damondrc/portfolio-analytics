# Digital Analytics Portfolio — GTM & GA4

Hands-on web tracking implementation on a simulated site, deployed with GitHub Pages.

> 🌐 **Live site:** https://damondrc.github.io/portfolio-analytics ·
> 🎯 **Instrumented demo (GTM + GA4):** [TechFlow](https://damondrc.github.io/portfolio-analytics/Proyecto-1/index.html)

## What's inside

**[1 — GTM + Event Tracking](https://damondrc.github.io/portfolio-analytics/Proyecto-1/index.html)**
Google Tag Manager implementation with three custom events wired through the dataLayer:

| Event | Trigger |
|---|---|
| CTA clicks | Click on tracked buttons/links |
| Scroll depth | User scrolls 75% of the page |
| Form submission | Contact form submit |

**[2 — GA4 + Conversions + Funnel](https://damondrc.github.io/portfolio-analytics/Proyecto-2/)**
Google Analytics 4 property connected via GTM: key events marked as conversions and a
conversion funnel built on top of the tracked events.

**[3 — Documented debugging](https://damondrc.github.io/portfolio-analytics/Proyecto-3/README.md)**
Real errors found during implementation, each with diagnosis and fix, validated with
GTM Preview Mode and GA4 DebugView.

## Stack

Google Tag Manager · Google Analytics 4 · HTML/CSS/JS · GitHub Pages

## This property feeds my other projects

The GA4 property instrumented here is a living data source — the rest of my portfolio
builds on what it collects:

- **[ecommerce-funnel-analysis](https://github.com/damondrc/ecommerce-funnel-analysis)** —
  funnel analysis with SQL + Tableau on GA4-style event data (simulated at scale).
- **[ga4-reporting-automation](https://github.com/damondrc/ga4-reporting-automation)** —
  automated weekly reporting pulling **this property's real data** via the GA4 Data API
  and GitHub Actions.

*Collection → Analysis → Activation.*
