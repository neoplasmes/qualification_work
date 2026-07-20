import { useCallback, useState } from 'react';

import {
    usePatchDatasetColumnMutation,
    type DatasetColumn,
    type DatasetMetadata,
} from '@/entities/dataset';

import type { DatasetColumnContextMenuState } from '../../DatasetColumnContextMenu';

/**
 * owns the column context menu and column-level dataset patch actions
 *
 * @param selectedDataset - dataset whose column metadata can be patched
 * @returns column menu state, loading state and column action handlers
 */
export const useDatasetColumnActions = (selectedDataset: DatasetMetadata | undefined) => {
    const [columnContextMenu, setColumnContextMenu] =
        useState<DatasetColumnContextMenuState | null>(null);
    const [patchDatasetColumn, patchColumnState] = usePatchDatasetColumnMutation();

    const closeColumnContextMenu = useCallback(() => {
        setColumnContextMenu(null);
    }, []);

    const handleColumnContextMenu = useCallback(
        (column: DatasetColumn, position: { x: number; y: number }) => {
            setColumnContextMenu({
                column,
                x: position.x,
                y: position.y,
            });
        },
        []
    );

    const handleColumnAnalysisToggle = async (
        column: DatasetColumn,
        isAnalyzable: boolean
    ) => {
        if (!selectedDataset) {
            return;
        }

        try {
            await patchDatasetColumn({
                datasetId: selectedDataset.dataset.id,
                orgId: selectedDataset.dataset.orgId,
                columnId: column.id,
                isAnalyzable,
            }).unwrap();
            closeColumnContextMenu();
        } catch {
            return;
        }
    };

    return {
        columnContextMenu,
        columnToggleLoading: patchColumnState.isLoading,
        closeColumnContextMenu,
        handleColumnAnalysisToggle,
        handleColumnContextMenu,
    };
};
