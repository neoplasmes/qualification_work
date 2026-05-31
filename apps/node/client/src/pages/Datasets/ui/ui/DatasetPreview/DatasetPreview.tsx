import type { GridSelection } from '@glideapps/glide-data-grid';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type SetStateAction,
} from 'react';

import {
    useDeleteRowMutation,
    useInsertRowMutation,
    useLazyGetDatasetRowsQuery,
    usePatchDatasetColumnMutation,
    useUpdateRowMutation,
    type DatasetColumn,
    type DatasetMetadata,
    type DatasetRow,
} from '@/entities/dataset';

import { PanelPlaceholder, StatusMessage } from '@/shared/ui';

import { EMPTY_GRID_SELECTION, HEADER_H, ROW_H, ROWS_PAGE_SIZE } from '../../../const';
import { getInsertRowData, isInsertRowValid, parseDatasetCellValue } from '../../../lib';

import type { DatasetColumnContextMenuState } from '../DatasetColumnContextMenu';
import { DatasetGrid } from '../DatasetGrid';
import type { DraftRowBounds, InsertRowDraft } from '../DatasetGrid/types';
import type { DatasetRowContextMenuState } from '../DatasetRowContextMenu';
import { DatasetPreviewOverlays } from './DatasetPreviewOverlays';
import { useMeasuredSize } from './useMeasuredSize';

import styles from './DatasetPreview.module.scss';

type DatasetPreviewProps = {
    selectedDataset: DatasetMetadata | undefined;
};

export const DatasetPreview = ({ selectedDataset }: DatasetPreviewProps) => {
    // sparse chunk cache: key = chunkIdx (rowIndex / ROWS_PAGE_SIZE), value = chunk rows
    const [loadedChunks, setLoadedChunks] = useState<Map<number, DatasetRow[]>>(
        () => new Map()
    );
    // mirror of loadedChunks for synchronous reads inside async fetch logic
    const loadedChunksRef = useRef<Map<number, DatasetRow[]>>(new Map());
    // total rows discovered from the most recent rows response (or dataset metadata)
    const [knownTotalRows, setKnownTotalRows] = useState<number | null>(null);
    // dedup in-flight chunk requests across rerenders
    const inflightChunksRef = useRef<Set<number>>(new Set());
    // bumped to ask the grid to scroll to the last row
    const [scrollToBottomSignal, setScrollToBottomSignal] = useState(0);
    // whether the last row is currently in view
    const [isAtBottom, setIsAtBottom] = useState(false);

    const [displayEdits, setDisplayEdits] = useState<
        Map<string, Record<string, unknown>>
    >(new Map());
    const pendingEditsRef = useRef<Map<string, Record<string, unknown>>>(new Map());
    const [insertDraft, setInsertDraft] = useState<InsertRowDraft | null>(null);
    const [contextMenu, setContextMenu] = useState<DatasetRowContextMenuState | null>(
        null
    );
    const [columnContextMenu, setColumnContextMenu] =
        useState<DatasetColumnContextMenuState | null>(null);
    const [gridSelection, setGridSelection] =
        useState<GridSelection>(EMPTY_GRID_SELECTION);
    const [draftRowTop, setDraftRowTop] = useState<number | null>(null);
    const { ref: gridContainerRef, size: gridSize } = useMeasuredSize<HTMLDivElement>();

    const [updateRow] = useUpdateRowMutation();
    const [insertRow, insertState] = useInsertRowMutation();
    const [deleteRow, deleteState] = useDeleteRowMutation();
    const [patchDatasetColumn, patchColumnState] = usePatchDatasetColumnMutation();
    const [fetchRows] = useLazyGetDatasetRowsQuery();

    const columns = selectedDataset?.columns ?? [];
    const totalRows = knownTotalRows ?? selectedDataset?.totalRows ?? 0;
    const gridHeight = Math.max(gridSize.h, HEADER_H + ROW_H);
    const datasetId = selectedDataset?.dataset.id;

    // viewport bounds -> grid-container-relative top of the row
    const handleDraftRowBoundsChange = useCallback(
        (bounds: DraftRowBounds | null) => {
            if (!bounds) {
                setDraftRowTop(null);

                return;
            }

            const containerTop =
                gridContainerRef.current?.getBoundingClientRect().top ?? 0;
            setDraftRowTop(bounds.y - containerTop);
        },
        [gridContainerRef]
    );

    const resetCache = useCallback(() => {
        loadedChunksRef.current = new Map();
        setLoadedChunks(loadedChunksRef.current);
        inflightChunksRef.current.clear();
        setKnownTotalRows(null);
        setDisplayEdits(new Map());
        pendingEditsRef.current.clear();
        setIsAtBottom(false);
    }, []);

    // reset cache only on dataset switch; external reloads (e.g. merge commit)
    // are handled by remounting via the parent's key, not by reacting to metadata
    useEffect(() => {
        resetCache();
        setInsertDraft(null);
        setContextMenu(null);
        setColumnContextMenu(null);
        setGridSelection(EMPTY_GRID_SELECTION);
    }, [datasetId, resetCache]);

    // fetch one chunk; idempotent (skips if cached or in-flight)
    const requestChunk = useCallback(
        async (chunkIdx: number) => {
            if (!datasetId || chunkIdx < 0) {
                return;
            }

            if (
                inflightChunksRef.current.has(chunkIdx) ||
                loadedChunksRef.current.has(chunkIdx)
            ) {
                return;
            }

            inflightChunksRef.current.add(chunkIdx);
            try {
                const res = await fetchRows(
                    {
                        datasetId,
                        offset: chunkIdx * ROWS_PAGE_SIZE,
                        limit: ROWS_PAGE_SIZE,
                    },
                    true
                ).unwrap();

                const next = new Map(loadedChunksRef.current);
                next.set(chunkIdx, res.rows);
                loadedChunksRef.current = next;
                setLoadedChunks(next);
                setKnownTotalRows(res.totalRows);
            } catch {
                // ignore; user can retry by scrolling
            } finally {
                inflightChunksRef.current.delete(chunkIdx);
            }
        },
        [datasetId, fetchRows]
    );

    // initial chunk on dataset open
    useEffect(() => {
        if (!datasetId) {
            return;
        }

        void requestChunk(0);
    }, [datasetId, requestChunk]);

    const getRowAt = useCallback(
        (absIndex: number): DatasetRow | undefined => {
            if (absIndex < 0) {
                return undefined;
            }

            const chunkIdx = Math.floor(absIndex / ROWS_PAGE_SIZE);
            const offset = absIndex % ROWS_PAGE_SIZE;

            return loadedChunks.get(chunkIdx)?.[offset];
        },
        [loadedChunks]
    );

    // ids of every loaded row touched by the native selection (row markers, the
    // active range, and any extra range rectangles); the draft row is skipped
    const touchedRowIds = useMemo(() => {
        const draftIndex = insertDraft?.visualIndex ?? null;
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
            if (draftIndex !== null && visualRow === draftIndex) {
                continue;
            }

            const sourceRow =
                draftIndex !== null && visualRow > draftIndex ? visualRow - 1 : visualRow;
            const row = getRowAt(sourceRow);
            if (row && !seen.has(row.id)) {
                seen.add(row.id);
                ids.push(row.id);
            }
        }

        return ids;
    }, [gridSelection, insertDraft, getRowAt]);

    const handleVisibleRangeChange = useCallback(
        (startRow: number, endRow: number) => {
            const startChunk = Math.max(0, Math.floor(startRow / ROWS_PAGE_SIZE));
            const endChunk = Math.max(0, Math.floor(endRow / ROWS_PAGE_SIZE));
            for (let c = startChunk; c <= endChunk; c++) {
                void requestChunk(c);
            }

            const reachedBottom = totalRows > 0 && endRow >= totalRows - 1;
            setIsAtBottom(prev => (prev === reachedBottom ? prev : reachedBottom));
        },
        [requestChunk, totalRows]
    );

    const handleScrollToBottom = useCallback(async () => {
        if (totalRows <= 0) {
            return;
        }

        const lastChunkIdx = Math.floor((totalRows - 1) / ROWS_PAGE_SIZE);
        await requestChunk(lastChunkIdx);
        setScrollToBottomSignal(s => s + 1);
    }, [requestChunk, totalRows]);

    // flush pending cell edits every 1s
    useEffect(() => {
        if (!selectedDataset) {
            return;
        }

        const dsId = selectedDataset.dataset.id;
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
                void updateRow({ datasetId: dsId, orgId, rowIds: [rowId], values });
            }
        }, 1000);

        return () => clearInterval(id);
    }, [contextMenu?.mode, insertDraft, selectedDataset, updateRow]);

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

    const handleRowContextMenu = useCallback(
        (rowIndex: number, position: { x: number; y: number }) => {
            if (insertDraft) {
                return;
            }

            const row = getRowAt(rowIndex);
            if (!row) {
                return;
            }

            // bulk only when the clicked row is part of a multi-row selection
            const isMulti = touchedRowIds.length > 1 && touchedRowIds.includes(row.id);

            setContextMenu({
                rowId: row.id,
                rowIndex,
                selectedRowIds: isMulti ? touchedRowIds : [row.id],
                x: position.x,
                y: position.y,
                mode: 'actions',
            });
            setColumnContextMenu(null);
        },
        [getRowAt, insertDraft, touchedRowIds]
    );

    const handleColumnContextMenu = useCallback(
        (column: DatasetColumn, position: { x: number; y: number }) => {
            if (insertDraft) {
                return;
            }

            setColumnContextMenu({
                column,
                x: position.x,
                y: position.y,
            });
            setContextMenu(null);
        },
        [insertDraft]
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
            resetCache();
            void requestChunk(0);
        } catch {
            // silent - user can retry
        }
    };

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
            setColumnContextMenu(null);
        } catch {
            // silent - user can retry from the same menu
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
            setContextMenu(null);
            setGridSelection(EMPTY_GRID_SELECTION);
            resetCache();
            void requestChunk(0);
        } catch {
            // silent - user can retry
        }
    };

    const handleClearSelected = async () => {
        if (!selectedDataset || !contextMenu) {
            return;
        }

        // clear every cell of the selected rows by nulling all column keys
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
            setContextMenu(null);
            setGridSelection(EMPTY_GRID_SELECTION);
            resetCache();
            void requestChunk(0);
        } catch {
            // silent - user can retry
        }
    };

    const isNewRowValid = insertDraft
        ? isInsertRowValid(columns, insertDraft.values)
        : false;

    // hide jump button when there's no point: empty dataset, fits in one page, or already at the end
    const showScrollToBottom = totalRows > ROWS_PAGE_SIZE && !isAtBottom && !insertDraft;

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
                        displayEdits={displayEdits}
                        insertDraft={insertDraft}
                        gridWidth={gridSize.w}
                        gridHeight={gridHeight}
                        scrollToBottomSignal={scrollToBottomSignal}
                        gridSelection={gridSelection}
                        onGridSelectionChange={setGridSelection}
                        onCellCommit={commitCell}
                        onDraftValueChange={handleDraftValueChange}
                        onRowContextMenu={handleRowContextMenu}
                        onColumnContextMenu={handleColumnContextMenu}
                        onDraftRowBoundsChange={handleDraftRowBoundsChange}
                        onVisibleRangeChange={handleVisibleRangeChange}
                    />
                )}

                <DatasetPreviewOverlays
                    insertDraft={insertDraft}
                    draftRowTop={draftRowTop}
                    contextMenu={contextMenu}
                    columnContextMenu={columnContextMenu}
                    insertValid={isNewRowValid}
                    insertLoading={insertState.isLoading}
                    deleteLoading={deleteState.isLoading}
                    columnToggleLoading={patchColumnState.isLoading}
                    showScrollToBottom={showScrollToBottom}
                    onScrollToBottom={() => void handleScrollToBottom()}
                    onInsertConfirm={() => void handleInsertConfirm()}
                    onInsertCancel={() => setInsertDraft(null)}
                    onInsertBelow={handleInsertBelow}
                    onClearSelected={() => void handleClearSelected()}
                    onAskDelete={() =>
                        setContextMenu(current =>
                            current ? { ...current, mode: 'delete' } : current
                        )
                    }
                    onDeleteConfirm={() => void handleDeleteConfirm()}
                    onColumnAnalysisToggle={(column, isAnalyzable) =>
                        void handleColumnAnalysisToggle(column, isAnalyzable)
                    }
                    onMenuCancel={() => {
                        setContextMenu(null);
                        setColumnContextMenu(null);
                    }}
                />
            </div>
        </section>
    );
};
