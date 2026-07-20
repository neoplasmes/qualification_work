import { useCallback, type Dispatch, type SetStateAction } from 'react';

import {
    useDeleteRowMutation,
    useInsertRowMutation,
    useUpdateRowMutation,
    type DatasetColumn,
    type DatasetMetadata,
    type DatasetRow,
} from '@/entities/dataset';

import type { DatasetRowContextMenuState } from '../../DatasetRowContextMenu';

type UseDatasetRowActionsParams = {
    selectedDataset: DatasetMetadata | undefined;
    columns: DatasetColumn[];
    contextMenu: DatasetRowContextMenuState | null;
    setContextMenu: Dispatch<SetStateAction<DatasetRowContextMenuState | null>>;
    getRowAt: (absIndex: number) => DatasetRow | undefined;
    requestChunk: (chunkIdx: number) => Promise<void>;
    resetRowsCache: () => void;
    resetCellEditing: () => void;
    resetGridSelection: () => void;
};

/**
 * coordinates row context menu commands with backend mutations and local grid resets
 *
 * @param params - row action dependencies owned by the workspace
 * @param params.selectedDataset - dataset whose rows can be mutated
 * @param params.columns - visible columns used to clear row values
 * @param params.contextMenu - current row menu state
 * @param params.setContextMenu - row menu state writer
 * @param params.getRowAt - resolves a visual row index into cached row data
 * @param params.requestChunk - reloads a page of rows after mutations
 * @param params.resetRowsCache - drops stale cached rows after mutations
 * @param params.resetCellEditing - drops local edit overlays after mutations
 * @param params.resetGridSelection - clears row selections after bulk mutations
 * @returns row menu state, loading state and row action handlers
 */
export const useDatasetRowActions = ({
    selectedDataset,
    columns,
    contextMenu,
    setContextMenu,
    getRowAt,
    requestChunk,
    resetRowsCache,
    resetCellEditing,
    resetGridSelection,
}: UseDatasetRowActionsParams) => {
    const [insertRow] = useInsertRowMutation();
    const [deleteRow, deleteState] = useDeleteRowMutation();
    const [updateRow] = useUpdateRowMutation();

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
            }).unwrap();
            resetRowsCache();
            resetCellEditing();
            void requestChunk(0);
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
            }).unwrap();
            closeRowContextMenu();
            resetGridSelection();
            resetRowsCache();
            resetCellEditing();
            void requestChunk(0);
        } catch {
            return;
        }
    };

    const handleClearSelected = async () => {
        if (!selectedDataset || !contextMenu) {
            return;
        }

        const values: Record<string, null> = {};
        for (const column of columns) {
            values[column.key] = null;
        }

        try {
            await updateRow({
                datasetId: selectedDataset.dataset.id,
                orgId: selectedDataset.dataset.orgId,
                rowIds: contextMenu.selectedRowIds,
                values,
            }).unwrap();
            closeRowContextMenu();
            resetGridSelection();
            resetRowsCache();
            resetCellEditing();
            void requestChunk(0);
        } catch {
            return;
        }
    };

    const askDelete = () => {
        setContextMenu(current => (current ? { ...current, mode: 'delete' } : current));
    };

    return {
        contextMenu,
        deleteLoading: deleteState.isLoading,
        askDelete,
        closeRowContextMenu,
        handleClearSelected,
        handleDeleteConfirm,
        handleInsertBelow,
        handleRowContextMenu,
        resetRowActions,
    };
};
