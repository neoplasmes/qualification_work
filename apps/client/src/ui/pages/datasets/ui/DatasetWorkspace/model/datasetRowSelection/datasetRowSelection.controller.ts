import type { DatasetRow } from '@/core/entities/datasetRow';
import type { GridSelection } from '@glideapps/glide-data-grid';
import { useCallback, useMemo, useState } from 'react';

import { emptyGridSelection } from '../../../../const';

/**
 * translates Glide grid selection ranges into stable dataset row ids for bulk row actions
 *
 * @param getRowAt - resolves a visual row index into cached row data
 * @returns grid selection state, touched row ids and selection update handlers
 */
export const useDatasetRowSelection = (
    getRowAt: (absIndex: number) => DatasetRow | undefined
) => {
    const [gridSelection, setGridSelection] = useState<GridSelection>(emptyGridSelection);

    const resetGridSelection = useCallback(() => {
        setGridSelection(emptyGridSelection);
    }, []);

    const touchedRowIds = useMemo(() => {
        const visualRows = new Set<number>(gridSelection.rows.toArray());
        const current = gridSelection.current;
        if (current) {
            for (const rect of [current.range, ...current.rangeStack]) {
                for (let r = rect.y; r < rect.y + rect.height; r++) {
                    visualRows.add(r);
                }
            }
        }

        const ids: string[] = [];
        const seen = new Set<string>();
        for (const visualRow of visualRows) {
            const row = getRowAt(visualRow);
            if (row && !seen.has(row.id)) {
                seen.add(row.id);
                ids.push(row.id);
            }
        }

        return ids;
    }, [gridSelection, getRowAt]);

    return {
        gridSelection,
        touchedRowIds,
        resetGridSelection,
        setGridSelection,
    };
};
