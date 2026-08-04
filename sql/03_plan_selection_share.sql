-- ============================================================
-- 03 · Cuota de selección por plan (KPI "plan preference")
-- Share de cada plan sobre el total de eventos select_item.
-- Responde el KPI del measurement plan: ¿qué plan atrae más interés?
-- ============================================================

DECLARE start_date STRING DEFAULT '20260601';
DECLARE end_date   STRING DEFAULT FORMAT_DATE('%Y%m%d', CURRENT_DATE());

SELECT
  item.item_id                                          AS plan_id,
  COUNT(*)                                              AS selects,
  ROUND(COUNT(*) / SUM(COUNT(*)) OVER (), 3)            AS share
FROM `your-project.analytics_XXXXXXXXX.events_*`,
  UNNEST(items) AS item
WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
  AND event_name = 'select_item'
GROUP BY plan_id
ORDER BY selects DESC;
