-- ============================================================
-- 01 · Funnel de conversión de 6 pasos (usuarios distintos por paso)
-- Reconstruye en SQL el mismo embudo del GA4 Exploration, desde el
-- export crudo de eventos. Es un embudo "abierto" (cuenta a cada usuario
-- que ALCANZÓ el paso); para la versión estrictamente secuencial ver la
-- nota al final.
-- Fuente de verdad de los eventos: ../docs/MEASUREMENT_PLAN.md
-- ============================================================

DECLARE start_date STRING DEFAULT '20260601';
DECLARE end_date   STRING DEFAULT FORMAT_DATE('%Y%m%d', CURRENT_DATE());

WITH ev AS (
  SELECT
    user_pseudo_id,
    event_name,
    (SELECT value.string_value
       FROM UNNEST(event_params)
      WHERE key = 'page_location') AS page_location
  FROM `your-project.analytics_XXXXXXXXX.events_*`
  WHERE _TABLE_SUFFIX BETWEEN start_date AND end_date
),

per_user AS (
  SELECT
    user_pseudo_id,
    -- Home: page_view en la landing de TechFlow
    LOGICAL_OR(event_name = 'page_view'
               AND page_location LIKE '%/Proyecto-1/index%') AS s1_home,
    LOGICAL_OR(event_name = 'view_item_list')                AS s2_view_planes,
    LOGICAL_OR(event_name = 'select_item')                   AS s3_elegir_plan,
    LOGICAL_OR(event_name = 'begin_checkout')                AS s4_iniciar_registro,
    LOGICAL_OR(event_name = 'sign_up')                       AS s5_cuenta_creada,
    LOGICAL_OR(event_name = 'purchase')                      AS s6_conversion
  FROM ev
  GROUP BY user_pseudo_id
)

SELECT
  COUNTIF(s1_home)             AS paso_1_home,
  COUNTIF(s2_view_planes)      AS paso_2_ver_planes,
  COUNTIF(s3_elegir_plan)      AS paso_3_elegir_plan,
  COUNTIF(s4_iniciar_registro) AS paso_4_iniciar_registro,
  COUNTIF(s5_cuenta_creada)    AS paso_5_cuenta_creada,
  COUNTIF(s6_conversion)       AS paso_6_conversion,
  -- tasa global de conversión del embudo
  SAFE_DIVIDE(COUNTIF(s6_conversion), COUNTIF(s1_home)) AS cvr_home_to_purchase
FROM per_user;

-- Nota: para un embudo ESTRICTAMENTE secuencial (cada paso después del
-- anterior en el tiempo), reemplazar LOGICAL_OR por MIN(event_timestamp)
-- por evento y exigir t(s1) <= t(s2) <= ... <= t(s6).
