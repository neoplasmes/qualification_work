import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { Button, HStack, Text } from '@qualification-work/design-system';
import { useCallback, useEffect, useState } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { StatusMessage } from '@/shared/ui';

import { headerHeight, rowHeight, rowsPageSize } from '../../const';
import { DatasetGrid } from '../DatasetGrid';
import type { DatasetRowContextMenuState } from '../DatasetRowContextMenu';
import {
    useDatasetCellEditing,
    useDatasetColumnActions,
    useDatasetRowActions,
    useDatasetRowsController,
    useDatasetRowSelection,
    useDatasetWorkspaceSize,
} from './model';
import { DatasetWorkspaceOverlays } from './ui';

import styles from './datasetWorkspace.module.css';

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
        isLoading,
        retry,
        error,
        totalRows,
        isAtBottom,
        scrollToBottomSignal,
        getRow: getRowAt,
        handleScrollToBottom,
        handleVisibleRangeChange,
    } = useDatasetRowsController({
        datasetId,
        orgId: selectedDataset?.dataset.orgId,
        metadataTotalRows: selectedDataset?.totalRows,
    });

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
            {selectedDataset && (
                <HStack className={styles.heading} gap={16} justify="space-between" wrap>
                    <Text as="h2" variant="heading-sm">
                        {selectedDataset.dataset.name}
                    </Text>
                    <Text variant="label">
                        {totalRows} строк · {columns.length} полей
                    </Text>
                </HStack>
            )}
            {!selectedDataset && (
                <p
                    className={styles['placeholder']}
                    data-stack="h"
                    data-align="center"
                    data-justify="center"
                    data-flex
                >
                    Выберите таблицу в списке.
                </p>
            )}

            {selectedDataset && isLoading && totalRows === 0 && (
                <StatusMessage>Загружаем строки…</StatusMessage>
            )}

            {Boolean(
                error || cellEditing.error || rowActions.error || columnActions.error
            ) && (
                <StatusMessage tone="error">
                    Не удалось подтвердить изменение или загрузить данные. Проверьте
                    данные перед повторным изменением.
                </StatusMessage>
            )}
            {Boolean(
                cellEditing.syncError || rowActions.syncError || columnActions.syncError
            ) && (
                <StatusMessage tone="error">
                    Изменения сохранены, но обновить данные не удалось. Повторите
                    загрузку.
                </StatusMessage>
            )}
            {selectedDataset && !isLoading && !error && totalRows === 0 && (
                <StatusMessage>В таблице пока нет строк.</StatusMessage>
            )}

            {selectedDataset && (
                <HStack className={styles.toolbar} gap={12} wrap justify="space-between">
                    <Text variant="body-sm" tone="muted">
                        Двойной щелчок — изменить ячейку. Правый щелчок — действия со
                        строкой или полем.
                    </Text>
                    {Boolean(
                        error ||
                        cellEditing.syncError ||
                        rowActions.syncError ||
                        columnActions.syncError
                    ) && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                void retry().catch(() => {});
                            }}
                        >
                            Повторить загрузку
                        </Button>
                    )}
                </HStack>
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
                    onScrollToBottom={() => {
                        void handleScrollToBottom().catch(() => {});
                    }}
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
