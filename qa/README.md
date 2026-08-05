# Tracking QA — contract testing del dataLayer

Trata la instrumentación como código con tests. `validate-tracking.mjs`
recorre el journey publicado, captura `window.dataLayer` en cada etapa y
**valida cada evento contra el esquema del measurement plan**:

- `view_item_list` con `items[]` de 3 planes y `item_list_id`.
- reset `ecommerce: null` antes de cada push ecommerce.
- `begin_checkout` con `value`, `currency` e item válido.
- `sign_up` con `method` y `plan_id` (y **sin PII** en el dataLayer).
- `purchase` con `transaction_id`, `value`, `currency` e item válido.
- `generate_lead` con `value`/`currency`.
- **deduplicación:** recargar la thank-you page no dispara otro `purchase`.

Si cualquier contrato falla, el proceso sale con código ≠ 0.

## Ejecución

```bash
cd qa
npm install
npx playwright install chromium
npm test                    # contra el sitio publicado
node validate-tracking.mjs http://localhost:8080/Proyecto-1   # contra local
```

## En CI

El workflow [`.github/workflows/tracking-qa.yml`](../.github/workflows/tracking-qa.yml)
corre estos checks en cada `push` y `pull_request`. Un cambio que rompa el
contrato de medición **hace fallar el build** antes de llegar a producción —
la medición deja de ser algo que se rompe en silencio.
