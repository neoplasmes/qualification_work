import { skipToken } from '@reduxjs/toolkit/query';
import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';

import {
    useDeleteRowMutation,
    useGetDatasetRowsQuery,
    useInsertRowMutation,
    useUpdateRowMutation,
    type DatasetColumn,
    type DatasetMetadata,
    type DatasetRow,
} from '@/entities/dataset';

import { PanelPlaceholder, StatusMessage } from '@/shared/ui';

import { HEADER_H, ROW_H, ROWS_PAGE_SIZE } from '../../../const';
import { getInsertRowData, isInsertRowValid, parseDatasetCellValue } from '../../../lib';

import { DatasetGrid } from '../DatasetGrid';
import type { InsertRowDraft } from '../DatasetGrid/types';
import { DatasetPreviewHeader } from '../DatasetPreviewHeader';
import type { DatasetRowContextMenuState } from '../DatasetRowContextMenu';
import { DatasetPreviewOverlays } from './DatasetPreviewOverlays';
import { useMeasuredSize } from './useMeasuredSize';

import styles from './DatasetPreview.module.scss';

type DatasetPreviewProps = {
    selectedDataset: DatasetMetadata | undefined;
};

export const DatasetPreview = ({ selectedDataset }: DatasetPreviewProps) => {
    const [fetchOffset, setFetchOffset] = useState(0);
    const [allRows, setAllRows] = useState<DatasetRow[]>([]);
    const [displayEdits, setDisplayEdits] = useState<
        Map<string, Record<string, unknown>>
    >(new Map());
    const pendingEditsRef = useRef<Map<string, Record<string, unknown>>>(new Map());
    const [insertDraft, setInsertDraft] = useState<InsertRowDraft | null>(null);
    const [contextMenu, setContextMenu] = useState<DatasetRowContextMenuState | null>(
        null
    );
    const { ref: gridContainerRef, size: gridSize } = useMeasuredSize<HTMLDivElement>();

    const [updateRow] = useUpdateRowMutation();
    const [insertRow, insertState] = useInsertRowMutation();
    const [deleteRow, deleteState] = useDeleteRowMutation();

    const rowsQuery = useGetDatasetRowsQuery(
        selectedDataset
            ? {
                  datasetId: selectedDataset.dataset.id,
                  offset: fetchOffset,
                  limit: ROWS_PAGE_SIZE,
              }
            : skipToken
    );

    const columns = selectedDataset?.columns ?? [];
    const totalRows = rowsQuery.data?.totalRows ?? selectedDataset?.totalRows ?? 0;
    const hasMore = allRows.length < totalRows;
    const gridHeight = Math.max(gridSize.h, HEADER_H + ROW_H);

    useEffect(() => {
        setFetchOffset(0);
        setAllRows([]);
        setDisplayEdits(new Map());
        pendingEditsRef.current.clear();
        setInsertDraft(null);
        setContextMenu(null);
    }, [selectedDataset?.dataset.id]);

    // append rows from current page
    useEffect(() => {
        if (!rowsQuery.data || rowsQuery.isFetching) {
            return;
        }

        setAllRows(prev => {
            if (prev.length !== fetchOffset) {
                return prev;
            }

            return [...prev, ...rowsQuery.data!.rows];
        });
    }, [rowsQuery.data, rowsQuery.isFetching, fetchOffset]);

    // flush pending cell edits every 1s
    useEffect(() => {
        if (!selectedDataset) {
            return;
        }

        const datasetId = selectedDataset.dataset.id;
        const orgId = selectedDataset.dataset.orgId;
        const id = setInterval(() => {
            if (insertDraft || contextMenu?.mode === 'delete') {
                return;
            }

            if (!pendingEditsRef.current.size) {
                return;
            }

            const batch = new Map(pendingEditsRef.current);
            pendingEditsRef.current.clear();
            for (const [rowId, values] of batch) {
                void updateRow({ datasetId, orgId, rowId, values });
            }
        }, 1000);

        return () => clearInterval(id);
    }, [contextMenu?.mode, insertDraft, selectedDataset?.dataset.id, updateRow]);

    const commitCell = useCallback(
        (rowId: string, col: DatasetColumn, rawValue: string) => {
            const parsed =
                rawValue === '' ? null : parseDatasetCellValue(rawValue, col.dataType);
            const pending = { ...pendingEditsRef.current.get(rowId) };
            pending[col.key] = parsed;
            pendingEditsRef.current.set(rowId, pending);
            setDisplayEdits(prev => {
                const next = new Map(prev);
                const row = { ...next.get(rowId) };
                row[col.key] = parsed;
                next.set(rowId, row);

                return next;
            });
        },
        []
    );

    const handleLoadMore = useCallback(() => {
        if (hasMore && !rowsQuery.isFetching) {
            setFetchOffset(allRows.length);
        }
    }, [hasMore, allRows.length, rowsQuery.isFetching]);

    const handleDraftValueChange = useCallback(
        (value: SetStateAction<Record<string, string>>) => {
            setInsertDraft(current => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    values: typeof value === 'function' ? value(current.values) : value,
                };
            });
        },
        []
    );

    const resetRows = useCallback(() => {
        setAllRows([]);
        setFetchOffset(0);
        setDisplayEdits(new Map());
        pendingEditsRef.current.clear();
    }, []);

    const handleRowContextMenu = useCallback(
        (rowIndex: number, position: { x: number; y: number }) => {
            if (insertDraft) {
                return;
            }

            const row = allRows[rowIndex];
            if (!row) {
                return;
            }

            setContextMenu({
                rowId: row.id,
                rowIndex,
                x: position.x,
                y: position.y,
                mode: 'actions',
            });
        },
        [allRows, insertDraft]
    );

    const handleInsertBelow = () => {
        if (!contextMenu) {
            return;
        }

        setInsertDraft({
            afterRowId: contextMenu.rowId,
            visualIndex: contextMenu.rowIndex + 1,
            values: {},
        });
        setContextMenu(null);
    };

    const handleInsertConfirm = async () => {
        if (!selectedDataset || !insertDraft) {
            return;
        }

        try {
            await insertRow({
                datasetId: selectedDataset.dataset.id,
                orgId: selectedDataset.dataset.orgId,
                afterRowId: insertDraft.afterRowId,
                data: getInsertRowData(columns, insertDraft.values),
            }).unwrap();
            setInsertDraft(null);
            resetRows();
        } catch {
            // silent - user can retry
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
                rowId: contextMenu.rowId,
            }).unwrap();
            setContextMenu(null);
            resetRows();
        } catch {
            // silent - user can retry
        }
    };

    const isNewRowValid = insertDraft
        ? isInsertRowValid(columns, insertDraft.values)
        : false;

    return (
        <section className={styles['preview']} aria-label="Dataset preview">
            <DatasetPreviewHeader
                hasDataset={!!selectedDataset}
                loadedCount={allRows.length}
                totalRows={totalRows}
                isFetching={rowsQuery.isFetching}
            />

            {!selectedDataset && (
                <PanelPlaceholder>Select a dataset to preview rows.</PanelPlaceholder>
            )}

            {selectedDataset && rowsQuery.isLoading && allRows.length === 0 && (
                <StatusMessage>Loading rows...</StatusMessage>
            )}

            <div ref={gridContainerRef} className={styles['grid-container']}>
                {selectedDataset && rowsQuery.data && gridSize.w > 0 && (
                    <DatasetGrid
                        columns={columns}
                        rows={allRows}
                        displayEdits={displayEdits}
                        insertDraft={insertDraft}
                        gridWidth={gridSize.w}
                        gridHeight={gridHeight}
                        hasMore={hasMore}
                        onCellCommit={commitCell}
                        onDraftValueChange={handleDraftValueChange}
                        onRowContextMenu={handleRowContextMenu}
                        onLoadMore={handleLoadMore}
                    />
                )}

                <DatasetPreviewOverlays
                    insertDraft={insertDraft}
                    contextMenu={contextMenu}
                    insertValid={isNewRowValid}
                    insertLoading={insertState.isLoading}
                    deleteLoading={deleteState.isLoading}
                    onInsertConfirm={() => void handleInsertConfirm()}
                    onInsertCancel={() => setInsertDraft(null)}
                    onInsertBelow={handleInsertBelow}
                    onAskDelete={() =>
                        setContextMenu(current =>
                            current ? { ...current, mode: 'delete' } : current
                        )
                    }
                    onDeleteConfirm={() => void handleDeleteConfirm()}
                    onMenuCancel={() => setContextMenu(null)}
                />
            </div>
        </section>
    );
};
