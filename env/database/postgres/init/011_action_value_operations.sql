WITH transformed_actions AS (
    SELECT
        action.id,
        jsonb_agg(
            CASE
                WHEN effect.item ->> 'kind' <> 'updateRowsByMatch' THEN effect.item
                ELSE jsonb_set(
                    effect.item,
                    '{values}',
                    COALESCE(
                        (
                            SELECT jsonb_object_agg(
                                value_mapping.key,
                                CASE
                                    WHEN value_mapping.value ->> 'kind' IN ('parameter', 'literal')
                                        AND NOT (value_mapping.value ? 'operation')
                                        THEN value_mapping.value || '{"operation": "="}'::jsonb
                                    ELSE value_mapping.value
                                END
                            )
                            FROM jsonb_each(effect.item -> 'values') AS value_mapping(key, value)
                        ),
                        '{}'::jsonb
                    )
                )
            END
            ORDER BY effect.ordinality
        ) AS effects
    FROM actions.actions AS action
    CROSS JOIN LATERAL jsonb_array_elements(action.effects)
        WITH ORDINALITY AS effect(item, ordinality)
    GROUP BY action.id
)
UPDATE actions.actions AS action
SET effects = transformed_actions.effects
FROM transformed_actions
WHERE action.id = transformed_actions.id
    AND action.effects IS DISTINCT FROM transformed_actions.effects;
