import { skipToken } from '@reduxjs/toolkit/query';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    useGetDatasetRowsQuery,
    useInsertRowMutation,
    useUpdateRowMutation,
    type DatasetColumn,
    type DatasetMetadata,
    type DatasetRow,
} from '@/entities/dataset';

import { Button, PanelPlaceholder, StatusMessage } from '@/shared/ui';

import { datasetsTestIds, HEADER_H, ROW_H, ROWS_PAGE_SIZE } from '../../../const';
import { getInsertRowData, isInsertRowValid, parseDatasetCellValue } from '../../../lib';

import { DatasetGrid } from '../DatasetGrid';
import { DatasetPreviewHeader } from '../DatasetPreviewHeader';
import { NewRowActions } from '../NewRowActions';

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
    const [isInsertingRow, setIsInsertingRow] = useState(false);
    const [newRowValues, setNewRowValues] = useState<Record<string, string>>({});
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const [gridSize, setGridSize] = useState({ w: 0, h: 0 });

    const [updateRow] = useUpdateRowMutation();
    const [insertRow, insertState] = useInsertRowMutation();

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
    const allRowsLoaded = !hasMore;
    const showAddRow = allRowsLoaded && !!selectedDataset && rowsQuery.data !== undefined;
    const rowCount = allRows.length + (isInsertingRow ? 1 : 0);
    const gridHeight = Math.max(gridSize.h, HEADER_H + ROW_H);

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

    // measure grid container
    useEffect(() => {
        const el = gridContainerRef.current;
        if (!el) {
            return;
        }

        const ro = new ResizeObserver(([e]) =>
            setGridSize({
                w: Math.floor(e.contentRect.width),
                h: Math.floor(e.contentRect.height),
            })
        );
        ro.observe(el);

        return () => ro.disconnect();
    }, []);

    // flush pending cell edits every 1s
    useEffect(() => {
        if (!selectedDataset) {
            return;
        }

        const datasetId = selectedDataset.dataset.id;
        const orgId = selectedDataset.dataset.orgId;
        const id = setInterval(() => {
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
    }, [selectedDataset?.dataset.id, updateRow]);

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

    const handleInsertConfirm = async () => {
        if (!selectedDataset) {
            return;
        }

        try {
            await insertRow({
                datasetId: selectedDataset.dataset.id,
                orgId: selectedDataset.dataset.orgId,
                data: getInsertRowData(columns, newRowValues),
            }).unwrap();
            setIsInsertingRow(false);
            setNewRowValues({});
        } catch {
            // silent - user can retry
        }
    };

    const isNewRowValid = isInsertRowValid(columns, newRowValues);

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
                        isInsertingRow={isInsertingRow}
                        newRowValues={newRowValues}
                        gridWidth={gridSize.w}
                        gridHeight={gridHeight}
                        hasMore={hasMore}
                        onCellCommit={commitCell}
                        onNewRowValueChange={setNewRowValues}
                        onLoadMore={handleLoadMore}
                    />
                )}
            </div>

            {isInsertingRow && (
                <NewRowActions
                    valid={isNewRowValid}
                    loading={insertState.isLoading}
                    onConfirm={() => void handleInsertConfirm()}
                    onCancel={() => {
                        setIsInsertingRow(false);
                        setNewRowValues({});
                    }}
                />
            )}

            {showAddRow && !isInsertingRow && (
                <Button
                    className={styles['add-row-button']}
                    data-test-id={datasetsTestIds.addRowButton}
                    onClick={() => setIsInsertingRow(true)}
                >
                    <Plus size={16} />
                    Add row
                </Button>
            )}
        </section>
    );
};
