-- $1: dashboard id (uuid)
-- $2: item id (uuid)
-- $3: user's org ids (uuid[])
-- $4: dataset id (uuid)
-- $5: metric display name
-- $6: aggregation expression
-- $7: display format suffix
-- $8: show trend sparkline flag
-- $9: trend time column key, NULL = auto-detect
-- $10: trend bucket size, NULL = auto-detect
-- $11: target value, NULL = no target
-- $12: target direction ('higher' | 'lower'), NULL = no target
-- $13: metric display multiplier
WITH owned AS (
	SELECT di.id
	FROM dashboards.dashboard_items di
	JOIN dashboards.dashboards d ON d.id = di.dashboard_id
	WHERE di.id = $2
		AND di.dashboard_id = $1
		AND di.item_type = 'metric'
		AND d.org_id = ANY($3::uuid[])
	FOR UPDATE
)
UPDATE dashboards.item_metrics m
SET
	dataset_id = $4,
	name = $5,
	expression = $6,
	format = $7,
	show_trend = $8,
	time_column = $9,
	time_bucket = $10,
	target = $11,
	target_direction = $12,
	value_multiplier = $13
FROM owned
WHERE m.item_id = owned.id
RETURNING m.item_id;
