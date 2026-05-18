WITH owned AS (
	SELECT id FROM dashboards.dashboards
	-- $1: target dashboard id (uuid)
	-- $2: user's provided org id (uuid)
	WHERE id = $1 AND org_id = ANY($2::uuid[])
	FOR UPDATE
),
next_pos AS (
	SELECT COALESCE(MAX(pos_y), -1) + 1 AS pos_y
	FROM dashboards.dashboard_items
	WHERE dashboard_id = (SELECT id FROM owned)
),
inserted AS (
	INSERT INTO dashboards.dashboard_items
		(dashboard_id, item_type, pos_x, pos_y, width, height)
	-- $3: pos_x (vertical-stack convention r.n.)
	-- $4: width (vertical-stack convention r.n.)
	-- $5: height
	SELECT owned.id, 'metric', $3, next_pos.pos_y, $4, $5
	FROM owned, next_pos
	RETURNING id, pos_y
),
link AS (
	INSERT INTO dashboards.item_metrics
		(item_id, dataset_id, name, expression, format)
	-- $6: dataset id the metric reads from (FK to data.datasets)
	-- $7: metric display name
	-- $8: aggregation expression, evaluated at server side at read time
	-- $9: display format enum ('currency' | 'percent' | 'number')
	SELECT id, $6, $7, $8, $9 FROM inserted
	RETURNING item_id
)
SELECT id, pos_y FROM inserted;
