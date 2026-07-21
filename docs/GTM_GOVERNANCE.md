# GTM Governance — Container GTM-NHRCHKWS

How this container is organized, named, versioned and QA'd. Written the way a
container shared by a team would be governed.

## 1. Naming conventions

Pattern: `{Type} - {Tool} - {Description}`

| Asset | Naming used in this container |
|---|---|
| Tags | `Tag - GA4 Config`, `Tag - select_item`, `Tag - purchase` |
| Triggers | `CE - select_item` (Custom Event), `Trigger - Clic CTA`, `Trigger - Scroll 50` |
| Variables | `GA4 measurement ID` (constant), `DLV - plan_id`, `DLV - value` |

Rules:
- One tag per GA4 event. No "multi-purpose" tags.
- The GA4 Measurement ID lives in **one** constant variable
  (`GA4 measurement ID`) referenced by every tag. Changing property = one edit.
- Folders: `01 Config`, `02 Events - Legacy`, `03 Events - Ecommerce`, `04 Consent`.

## 2. Versioning & workspaces

- Every publish gets a **version name and description**: what changed and why,
  referencing the Measurement Plan version (e.g. "v1.0 — ecommerce events per
  MEASUREMENT_PLAN 1.0").
- One workspace per change package. No editing directly on top of unrelated
  in-flight changes.
- After each publish, export the container (Admin → Export Container, latest
  version) and commit it to [`/gtm/`](../gtm/) in this repo. The container
  config is code; it belongs in version control.

## 3. Consent settings

Every GA4 tag uses GTM's built-in consent checks (Tag → Advanced → Consent
Settings): require `analytics_storage`. With Consent Mode v2, Google tags also
respect consent state natively (cookieless pings when denied).

## 4. QA checklist (run before every publish)

1. **GTM Preview Mode** — every new/changed tag fires on its intended trigger
   and *only* there. Inspect the dataLayer values at the moment of firing.
2. **Ecommerce payload** — `items[]` present, correct `item_id`/`price`;
   `ecommerce: null` reset confirmed between events.
3. **GA4 DebugView** — events arrive with all parameters; no `(not set)`.
4. **Consent states** — test the full journey twice: consent **granted** and
   consent **denied**. With denied, tags gated on `analytics_storage` must not
   fire (or fire cookieless, per configuration).
5. **Deduplication** — reload `gracias.html`: `purchase` must NOT fire twice
   for the same `transaction_id`.
6. **No PII** — search the outgoing `collect` requests (DevTools → Network) for
   any name/email. Must be zero.
7. **Cross-page regression** — legacy events (`click_cta`, `form_submit`,
   `scroll_50`, `click_proyecto_*`) still fire.

## 5. Publishing rhythm

Plan (Measurement Plan) → Implement (workspace) → QA (checklist above) →
Publish (named version) → Export container JSON to repo → Update docs.
