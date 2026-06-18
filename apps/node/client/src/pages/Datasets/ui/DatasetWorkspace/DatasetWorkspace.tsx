import { useCallback, useEffect, useState } from 'react';

import type { DatasetColumn, DatasetMetadata } from '@/entities/dataset';

import { PanelPlaceholder, StatusMessage } from '@/shared/ui';

import { headerHeight, rowHeight, rowsPageSize } from '../../const';
import { DatasetGrid } from '../DatasetGrid';
import type { DatasetRowContextMenuState } from '../DatasetRowContextMenu';
import {
    useDatasetCellEditing,
    useDatasetColumnActions,
    useDatasetRowActions,
    useDatasetRowsCache,
    useDatasetRowSelection,
    useDatasetWorkspaceSize,
} from './model';
import { DatasetWorkspaceOverlays } from './ui';

import styles from './DatasetWorkspace.module.scss';

type DatasetWorkspaceProps = {
    selectedDataset: DatasetMetadata | undefined;
};

export const DatasetWorkspace = ({ selectedDataset }: DatasetWorkspaceProps) => {
    const columns = selectedDataset?.columns ?? [];
    const datasetId = selectedDataset?.dataset.id;
    const [contextMenu, setContextMenu] = useState<DatasetRowContextMenuState | null>(
        null
    );
    const { ref: gridContainerRef, size: gridSize } =
        useDatasetWorkspaceSize<HTMLDivElement>();
    const {
        loadedChunks,
        totalRows,
        isAtBottom,
        scrollToBottomSignal,
        getRowAt,
        handleScrollToBottom,
        handleVisibleRangeChange,
        requestChunk,
        resetRowsCache,
    } = useDatasetRowsCache(datasetId, selectedDataset?.totalRows);

    const rowSelection = useDatasetRowSelection(getRowAt);
    const cellEditing = useDatasetCellEditing(
        selectedDataset,
        contextMenu?.mode === 'delete'
    );
    const rowActions = useDatasetRowActions({
        selectedDataset,
        columns,
        contextMenu,
        setContextMenu,
        getRowAt,
        requestChunk,
        resetRowsCache,
        resetCellEditing: cellEditing.resetCellEditing,
        resetGridSelection: rowSelection.resetGridSelection,
    });
    const columnActions = useDatasetColumnActions(selectedDataset);

    useEffect(() => {
        rowActions.resetRowActions();
        columnActions.closeColumnContextMenu();
        rowSelection.resetGridSelection();
    }, [
        columnActions.closeColumnContextMenu,
        datasetId,
        rowActions.resetRowActions,
        rowSelection.resetGridSelection,
    ]);

    const handleRowContextMenu = useCallback(
        (rowIndex: number, position: { x: number; y: number }) => {
            rowActions.handleRowContextMenu(
                rowIndex,
                position,
                rowSelection.touchedRowIds
            );
            columnActions.closeColumnContextMenu();
        },
        [
            columnActions.closeColumnContextMenu,
            rowActions.handleRowContextMenu,
            rowSelection.touchedRowIds,
        ]
    );

    const handleColumnContextMenu = useCallback(
        (column: DatasetColumn, position: { x: number; y: number }) => {
            columnActions.handleColumnContextMenu(column, position);
            rowActions.closeRowContextMenu();
        },
        [columnActions.handleColumnContextMenu, rowActions.closeRowContextMenu]
    );

    const handleMenuCancel = useCallback(() => {
        rowActions.closeRowContextMenu();
        columnActions.closeColumnContextMenu();
    }, [columnActions.closeColumnContextMenu, rowActions.closeRowContextMenu]);

    const gridHeight = Math.max(gridSize.h, headerHeight + rowHeight);
    const showScrollToBottom = totalRows > rowsPageSize && !isAtBottom;

    return (
        <section
            className={styles['preview']}
            data-stack="v"
            data-gap="sm"
            data-flex
            aria-label="Dataset preview"
        >
            {!selectedDataset && (
                <PanelPlaceholder>Select a dataset to preview rows.</PanelPlaceholder>
            )}

            {selectedDataset && totalRows === 0 && loadedChunks.size === 0 && (
                <StatusMessage>Loading rows...</StatusMessage>
            )}

            <div ref={gridContainerRef} className={styles['grid-container']} data-flex>
                {selectedDataset && gridSize.w > 0 && (
                    <DatasetGrid
                        datasetId={selectedDataset.dataset.id}
                        columns={columns}
                        totalRows={totalRows}
                        getRowAt={getRowAt}
                        displayEdits={cellEditing.displayEdits}
                        invalidCellKeys={cellEditing.invalidCellKeys}
                        gridWidth={gridSize.w}
                        gridHeight={gridHeight}
                        scrollToBottomSignal={scrollToBottomSignal}
                        gridSelection={rowSelection.gridSelection}
                        onGridSelectionChange={rowSelection.setGridSelection}
                        onCellCommit={cellEditing.commitCell}
                        onRowContextMenu={handleRowContextMenu}
                        onColumnContextMenu={handleColumnContextMenu}
                        onVisibleRangeChange={handleVisibleRangeChange}
                    />
                )}

                <DatasetWorkspaceOverlays
                    contextMenu={contextMenu}
                    columnContextMenu={columnActions.columnContextMenu}
                    deleteLoading={rowActions.deleteLoading}
                    columnToggleLoading={columnActions.columnToggleLoading}
                    showScrollToBottom={showScrollToBottom}
                    onScrollToBottom={() => void handleScrollToBottom()}
                    onInsertBelow={() => void rowActions.handleInsertBelow()}
                    onClearSelected={() => void rowActions.handleClearSelected()}
                    onAskDelete={rowActions.askDelete}
                    onDeleteConfirm={() => void rowActions.handleDeleteConfirm()}
                    onColumnAnalysisToggle={(column, isAnalyzable) =>
                        void columnActions.handleColumnAnalysisToggle(
                            column,
                            isAnalyzable
                        )
                    }
                    onMenuCancel={handleMenuCancel}
                />
            </div>
        </section>
    );
};
