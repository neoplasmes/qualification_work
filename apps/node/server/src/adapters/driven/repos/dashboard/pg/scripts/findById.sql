SELECT
	d.id,
	d.org_id,
	d.name,
	d.created_at,
	d.updated_at,
	COALESCE(
		(SELECT json_agg(
			CASE WHEN di.item_type = 'chart' THEN
				json_build_object(
					'id',      di.id,
					'kind',    'chart',
					'layout',  json_build_object(
						'posX',   di.pos_x,
						'posY',   di.pos_y,
						'width',  di.width,
						'height', di.height
					),
					'chartId', ic.chart_id
				)
			ELSE
				json_build_object(
					'id',         di.id,
					'kind',       'metric',
					'layout',     json_build_object(
						'posX',   di.pos_x,
						'posY',   di.pos_y,
						'width',  di.width,
						'height', di.height
					),
					'datasetId',       im.dataset_id,
					'name',            im.name,
					'expression',      im.expression,
					'format',          im.format,
					'valueMultiplier', im.value_multiplier,
					'target',          im.target,
					'targetDirection', im.target_direction,
					'showTrend',       im.show_trend,
					'timeColumn',      im.time_column,
					'timeBucket',      im.time_bucket
				)
			END
			ORDER BY di.pos_y, di.pos_x
		)
		FROM dashboards.dashboard_items di
		LEFT JOIN dashboards.item_charts  ic ON ic.item_id = di.id
		LEFT JOIN dashboards.item_metrics im ON im.item_id = di.id
		WHERE di.dashboard_id = d.id),
		'[]'::json
	) AS items
FROM dashboards.dashboards d
-- $1: dashboard id being fetched (uuid)
-- $2: caller's org ids, used as multi-tenant filter
WHERE d.id = $1 AND d.org_id = ANY($2::uuid[]);
