-- ============================================================
-- 04 · Data-quality: deduplicación de purchase por transaction_id
-- La capa de tracking deduplica el purchase por transaction_id
-- (recargar la thank-you page NO debe volver a contar la compra).
-- Esta query valida esa regla en el warehouse: cada fila devuelta es
-- un transaction_id enviado más de una vez. Resultado vacío = correcto.
-- ============================================================

DECLARE start_date STRING DEFAULT '20260601';
DECLARE end_date   STRING DEFAULT FORMAT_DATE('%Y%m%d', CURRENT_DATE());

SELECT
  (SELECT value.string_value
     FROM UNNEST(event_params)
    WHERE key = 'transaction_id')          AS transaction_id,
  COUNT(*)                                 AS purchase_events,
  COUNT(DISTINCT user_pseudo_id)           AS distinct_users
FROM `your-project.analytics_XXXXXXXXX.events_*`
WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
  AND event_name = 'purchase'
GROUP BY transaction_id
HAVING COUNT(*) > 1          -- solo duplicados
ORDER BY purchase_events DESC;
