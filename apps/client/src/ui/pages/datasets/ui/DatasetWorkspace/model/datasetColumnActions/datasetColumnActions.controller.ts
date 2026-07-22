import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { useCommand } from '@/env/cache/useCommand';
import { useDependencies } from '@/ui/di/dependencies';
import { useCallback, useState } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import type { DatasetColumnContextMenuState } from '../../../DatasetColumnContextMenu';

/**
 * owns the column context menu and column-level dataset patch actions
 *
 * @param selectedDataset - dataset whose column metadata can be patched
 * @returns column menu state, loading state and column action handlers
 */
export const useDatasetColumnActions = (selectedDataset: DatasetMetadata | undefined) => {
    const [columnContextMenu, setColumnContextMenu] =
        useState<DatasetColumnContextMenuState | null>(null);
    const {
        execute: patchDatasetColumn,
        isPending,
        error,
        syncError,
    } = useCommand(useDependencies().patchDatasetColumn);

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
            });
            closeColumnContextMenu();
        } catch {
            return;
        }
    };

    return {
        columnContextMenu,
        columnToggleLoading: isPending,
        error,
        syncError,
        closeColumnContextMenu,
        handleColumnAnalysisToggle,
        handleColumnContextMenu,
    };
};
