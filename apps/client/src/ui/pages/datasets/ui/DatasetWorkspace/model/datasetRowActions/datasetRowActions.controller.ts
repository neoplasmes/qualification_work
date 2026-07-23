import type { DatasetRow } from '@/core/entities/datasetRow';
import { useCommand } from '@/env/cache/useCommand';
import { useDependencies } from '@/ui/di/dependencies';
import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import type { DatasetRowContextMenuState } from '../../../DatasetRowContextMenu';

type UseDatasetRowActionsParams = {
    selectedDataset: DatasetMetadata | undefined;
    clearRows: (rowIds: string[]) => Promise<void>;
    contextMenu: DatasetRowContextMenuState | null;
    setContextMenu: Dispatch<SetStateAction<DatasetRowContextMenuState | null>>;
    getRowAt: (absIndex: number) => DatasetRow | undefined;
    resetCellEditing: (rowIds?: string[]) => void;
    resetGridSelection: () => void;
};

/**
 * coordinates row context menu commands with backend mutations and local grid resets
 *
 * @param params - row action dependencies owned by the workspace
 * @param params.selectedDataset - dataset whose rows can be mutated
 * @param params.clearRows - coordinates bulk clear with pending cell revisions
 * @param params.contextMenu - current row menu state
 * @param params.setContextMenu - row menu state writer
 * @param params.getRowAt - resolves a visual row index into cached row data
 * @param params.resetCellEditing - drops local edit overlays after mutations
 * @param params.resetGridSelection - clears row selections after bulk mutations
 * @returns row menu state, loading state and row action handlers
 */
export const useDatasetRowActions = ({
    selectedDataset,
    clearRows,
    contextMenu,
    setContextMenu,
    getRowAt,
    resetCellEditing,
    resetGridSelection,
}: UseDatasetRowActionsParams) => {
    const dependencies = useDependencies();
    const [clearLoading, setClearLoading] = useState(false);
    const clearPending = useRef(false);

    const {
        execute: insertRow,
        error: insertError,
        syncError: insertSyncError,
    } = useCommand(dependencies.insertDatasetRow);
    const {
        execute: deleteRow,
        isPending: deleteLoading,
        error: deleteError,
        syncError: deleteSyncError,
    } = useCommand(dependencies.deleteDatasetRows);

    const closeRowContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    const resetRowActions = useCallback(() => {
        setContextMenu(null);
    }, []);

    const handleRowContextMenu = useCallback(
        (
            rowIndex: number,
            position: { x: number; y: number },
            selectedRowIds: string[]
        ) => {
            const row = getRowAt(rowIndex);
            if (!row) {
                return;
            }

            const isMulti = selectedRowIds.length > 1 && selectedRowIds.includes(row.id);

            setContextMenu({
                rowId: row.id,
                rowIndex,
                selectedRowIds: isMulti ? selectedRowIds : [row.id],
                x: position.x,
                y: position.y,
                mode: 'actions',
            });
        },
        [getRowAt]
    );

    const handleInsertBelow = async () => {
        if (!selectedDataset || !contextMenu) {
            return;
        }

        closeRowContextMenu();

        try {
            await insertRow({
                datasetId: selectedDataset.dataset.id,
                orgId: selectedDataset.dataset.orgId,
                afterRowId: contextMenu.rowId,
                data: {},
            });
        } catch {
            return;
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDataset || !contextMenu) {
            return;
        }

        try {
            await deleteRow({
                datasetId: selectedDataset.dataset.id,
                orgId: selectedDataset.dataset.orgId,
                rowIds: contextMenu.selectedRowIds,
            });
            resetCellEditing(contextMenu.selectedRowIds);
            closeRowContextMenu();
            resetGridSelection();
        } catch {
            return;
        }
    };

    const handleClearSelected = async () => {
        if (!selectedDataset || !contextMenu || clearPending.current) {
            return;
        }

        clearPending.current = true;
        setClearLoading(true);

        try {
            await clearRows(contextMenu.selectedRowIds);
            closeRowContextMenu();
            resetGridSelection();
        } catch {
            return;
        } finally {
            clearPending.current = false;
            setClearLoading(false);
        }
    };

    const askDelete = () => {
        setContextMenu(current => (current ? { ...current, mode: 'delete' } : current));
    };

    return {
        contextMenu,
        clearLoading,
        deleteLoading,
        error: insertError ?? deleteError,
        syncError: insertSyncError ?? deleteSyncError,
        askDelete,
        closeRowContextMenu,
        handleClearSelected,
        handleDeleteConfirm,
        handleInsertBelow,
        handleRowContextMenu,
        resetRowActions,
    };
};
