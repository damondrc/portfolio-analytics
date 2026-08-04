# SQL — Analysis on the raw GA4 BigQuery export

The GA4 property is linked to **BigQuery** (free daily export), so every event
this site collects lands as raw rows. These queries reconstruct the funnel and
the ecommerce analysis **from the event-level data** — the layer a measurement
engineer owns, beyond the GA4 UI.

## Setup (one-time)

1. GA4 → **Admin → Product links → BigQuery links → Link**.
2. Pick a Google Cloud project (the BigQuery **sandbox** is free and enough here).
3. Choose **Daily** export (and Streaming if you want intraday). Events start
   landing the next day in a dataset named `analytics_<PROPERTY_ID>`.
4. In each query, replace the placeholder
   `` `your-project.analytics_XXXXXXXXX.events_*` `` with your real table.

## Schema notes

GA4 export tables are `events_YYYYMMDD` (query them with the `events_*`
wildcard + `_TABLE_SUFFIX` for the date range). Key shapes used here:

- `event_name` — STRING.
- `event_params` — `ARRAY<STRUCT<key, value STRUCT<string_value, int_value, …>>>`;
  extracted with an `UNNEST(event_params)` subquery.
- `items` — `ARRAY<STRUCT<item_id, item_name, price, quantity, …>>`; the
  ecommerce array, flattened with `UNNEST(items)`.
- `user_pseudo_id` — anonymous client identifier (per browser/consent).

## Queries

| File | What it answers |
|---|---|
| [`01_funnel.sql`](01_funnel.sql) | Users reaching each of the 6 journey steps. |
| [`02_conversion_by_plan.sql`](02_conversion_by_plan.sql) | Purchases and revenue per plan (unnests `items[]`). |
| [`03_plan_selection_share.sql`](03_plan_selection_share.sql) | Share of `select_item` by plan — the "plan preference" KPI. |
| [`04_purchase_dedup_check.sql`](04_purchase_dedup_check.sql) | Data-quality check: any `transaction_id` sent more than once. |
| [`05_consent_signal_split.sql`](05_consent_signal_split.sql) | Event volume by consent state (granted vs denied pings). |

Each query has a configurable date range at the top. They mirror the
definitions in [`../docs/MEASUREMENT_PLAN.md`](../docs/MEASUREMENT_PLAN.md);
the plan is the source of truth, these are its SQL expression.
