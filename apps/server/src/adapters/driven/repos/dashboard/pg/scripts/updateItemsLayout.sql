WITH owned AS (
	SELECT id FROM dashboards.dashboards
	-- $1: dashboard id whose item layout is being updated (uuid)
	-- $2: caller's org ids, used as multi-tenant filter
	WHERE id = $1 AND org_id = ANY($2::uuid[])
),
requested AS (
	SELECT *
	FROM unnest($3::uuid[], $4::int[], $5::int[], $6::int[], $7::int[])
		AS v(item_id, pos_x, pos_y, width, height)
),
matched AS (
	SELECT
		r.item_id,
		r.pos_x,
		r.pos_y,
		r.width,
		r.height,
		di.item_type
	FROM requested r
	JOIN dashboards.dashboard_items di ON di.id = r.item_id
	JOIN owned ON di.dashboard_id = owned.id
),
counts AS (
	SELECT
		(SELECT COUNT(*) FROM owned)::int AS dashboard_count,
		(
			SELECT COUNT(*)
			FROM dashboards.dashboard_items di
			JOIN owned ON di.dashboard_id = owned.id
		)::int AS item_count,
		(SELECT COUNT(*) FROM matched)::int AS matched_count,
		(
			SELECT COUNT(*)
			FROM matched
			WHERE
				(item_type = 'metric' AND (width < $8 OR height < $9))
				OR (item_type = 'chart' AND (width < $10 OR height < $11))
		)::int AS invalid_size_count
),
updated AS (
	UPDATE dashboards.dashboard_items di
	SET pos_x = m.pos_x, pos_y = m.pos_y, width = m.width, height = m.height
	-- $3: parallel array of item ids (uuid[])
	-- $4: parallel array of pos_x values (int[])
	-- $5: parallel array of pos_y values (int[])
	-- $6: parallel array of width values (int[])
	-- $7: parallel array of height values (int[])
	-- $8/$9: metric min width/height
	-- $10/$11: chart min width/height
	FROM matched m, counts c
	WHERE di.id = m.item_id
		AND c.dashboard_count = 1
		AND c.item_count = (SELECT COUNT(*) FROM requested)
		AND c.matched_count = (SELECT COUNT(*) FROM requested)
		AND c.invalid_size_count = 0
	RETURNING di.id
)
SELECT
	dashboard_count,
	item_count,
	matched_count,
	invalid_size_count,
	(SELECT COUNT(*) FROM updated)::int AS updated_count
FROM counts;
