WITH owned AS (
	SELECT id FROM dashboards.dashboards
	-- $1: dashboard id whose items are being reordered (uuid)
	-- $2: caller's org ids, used as multi-tenant filter
	WHERE id = $1 AND org_id = ANY($2::uuid[])
),
updated AS (
	UPDATE dashboards.dashboard_items di
	SET pos_y = v.pos_y
	-- $3: parallel array of item ids in the new order (uuid[])
	-- $4: parallel array of target pos_y values (int[])
	FROM unnest($3::uuid[], $4::int[]) AS v(item_id, pos_y), owned
	WHERE di.id = v.item_id
		AND di.dashboard_id = owned.id
	RETURNING di.id
)
SELECT
	(SELECT COUNT(*) FROM owned)::int   AS dashboard_count,
	(SELECT COUNT(*) FROM updated)::int AS updated_count;
