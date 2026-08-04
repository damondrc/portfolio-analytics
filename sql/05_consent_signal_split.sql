-- ============================================================
-- 05 · Volumen de eventos por estado de consentimiento
-- Con Consent Mode v2, los hits con analytics_storage denegado llegan
-- como pings "cookieless": sin cookies persistentes, GA4 genera un
-- user_pseudo_id efímero por evento. Un ratio alto de usuarios con un
-- solo evento es señal del tráfico con consentimiento denegado.
-- Sirve para explicar el sub-conteo documentado en el measurement plan.
-- ============================================================

DECLARE start_date STRING DEFAULT '20260601';
DECLARE end_date   STRING DEFAULT FORMAT_DATE('%Y%m%d', CURRENT_DATE());

WITH per_user AS (
  SELECT
    user_pseudo_id,
    COUNT(*)                              AS events,
    COUNT(DISTINCT event_name)            AS distinct_events
  FROM `your-project.analytics_XXXXXXXXX.events_*`
  WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
  GROUP BY user_pseudo_id
)

SELECT
  CASE
    WHEN events = 1 THEN 'probable_denied (1 evento)'
    ELSE 'probable_granted (sesión con continuidad)'
  END                                        AS consent_bucket,
  COUNT(*)                                   AS users,
  ROUND(COUNT(*) / SUM(COUNT(*)) OVER (), 3) AS share
FROM per_user
GROUP BY consent_bucket
ORDER BY users DESC;

-- Nota: es una aproximación. La señal de consentimiento exacta (gcs) no
-- viaja en el export estándar; para análisis preciso se registra el
-- estado de consentimiento como parámetro propio de evento.
