# GTM/GA4 Setup Guide — Your manual tasks

The code in this repo pushes everything to the dataLayer, but GTM and GA4 live
in your Google accounts — these steps can only be done there. Do them in order,
each one matched to the commit phase in the README plan.

---

## Phase B — Fix the duplicate GA4 install (do BEFORE publishing Phase B code)

The direct `gtag.js` snippet was removed from the HTML (it double-counted
page_views alongside the GA4 tag in GTM). Verify in GTM:

1. Confirm you have exactly **one** GA4 Config/Google tag in the container
   with Measurement ID `G-HV1S1BRJ8S`, firing on All Pages.
2. Use the constant variable `GA4 measurement ID` = `G-HV1S1BRJ8S` and point the
   config tag (and later all event tags) at it.
3. After deploying the code: open the site, DevTools → Network → filter
   `collect` — there must be exactly **one** `page_view` hit per page load.
4. Screenshot before/after for Proyecto-3 Bug #4 if you can reproduce the old
   behavior first (load the old commit locally).

## Phase C/D — Ecommerce event tags

For each event (`view_item_list`, `select_item`, `begin_checkout`, `sign_up`,
`purchase`, `generate_lead`):

1. **Trigger:** Custom Event, event name exactly as above
   (`CE - view_item_list`, etc.).
2. **Tag:** GA4 Event tag, Event Name = same name, Measurement ID =
   `{{GA4 measurement ID}}`.
   - For the four ecommerce events: check **"Send Ecommerce data"** with
     source = Data Layer. No manual parameter mapping needed for `items[]`.
   - For `sign_up`: add event parameter `plan_id` → new variable
     `DLV - plan_id` (Data Layer Variable, name `plan_id`).
   - For `generate_lead`: map `value` → `DLV - value` and `currency` →
     `DLV - currency` (or rely on ecommerce object if you prefer).
3. Organize into folders per [GTM_GOVERNANCE.md](GTM_GOVERNANCE.md).
4. QA with the checklist, then publish as version
   **"v1.0 — ecommerce journey (MEASUREMENT_PLAN 1.0)"**.

### In GA4:

1. Admin → Custom definitions → create event-scoped dimension `plan_id`.
2. Admin → Events → mark as **key events**: `sign_up`, `purchase`,
   `generate_lead` (keep `form_submit`).
3. Explorations → new Funnel: `view_item_list → select_item → begin_checkout
   → sign_up → purchase`. Screenshot it → replace/add in `Proyecto-2/`.

## Phase E — Consent Mode v2

1. In GTM, on every GA4 tag: Advanced Settings → Consent Settings → require
   `analytics_storage` (built-in check). Google tags additionally honor
   Consent Mode natively.
2. Test with GTM Preview:
   - Fresh incognito window → banner appears → **reject** → navigate the
     funnel → GA4 tags must not set cookies / must not fire (per your gating).
   - Accept → everything fires normally.
3. In GA4: Admin → Data Streams → verify consent signals are being received
   (Admin → Consent settings shows Consent Mode status).

## Phase F — Container export

Admin → Export Container → choose the latest published version → save as
`gtm/container-export.json` → commit. Re-export after every future publish.

## Reminder for ga4-reporting-automation

After Phase C/D is live, update the Data API queries in
`ga4-reporting-automation` to include the new event names (additive change).
After Phase E, add a note to the report template: consent-denied traffic
under-counts from the go-live date onward.
