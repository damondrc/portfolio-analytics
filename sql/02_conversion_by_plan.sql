-- ============================================================
-- 02 · Compras e ingresos por plan (unnest del array items[])
-- Aplana el array ecommerce `items` de los eventos `purchase` y agrega
-- por plan. Demuestra el manejo del esquema ecommerce en el warehouse.
-- ============================================================

DECLARE start_date STRING DEFAULT '20260601';
DECLARE end_date   STRING DEFAULT FORMAT_DATE('%Y%m%d', CURRENT_DATE());

SELECT
  item.item_id                                        AS plan_id,
  item.item_name                                      AS plan_name,
  COUNT(*)                                             AS purchases,
  ROUND(SUM(item.price * item.quantity), 2)           AS revenue_usd,
  ROUND(AVG(item.price), 2)                            AS avg_price_usd
FROM `your-project.analytics_XXXXXXXXX.events_*`,
  UNNEST(items) AS item
WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
  AND event_name = 'purchase'
GROUP BY plan_id, plan_name
ORDER BY purchases DESC;

-- El plan Starter aparece con revenue 0 (precio $0) de forma intencional:
-- confirma que el esquema ecommerce funciona con independencia del valor.
