import { skipToken } from '@reduxjs/toolkit/query';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    useGetDatasetRowsQuery,
    useInsertRowMutation,
    useUpdateRowMutation,
    type DatasetColumn,
    type DatasetMetadata,
} from '@/entities/dataset';

import { Button, PanelPlaceholder, StatusMessage } from '@/shared/ui';

import {
    datasetsTestIds,
    HEADER_H,
    MAX_GRID_H,
    ROW_H,
    ROWS_PAGE_SIZE,
} from '../../../const';
import { getInsertRowData, isInsertRowValid, parseDatasetCellValue } from '../../../lib';

import { DatasetGrid } from '../DatasetGrid';
import { DatasetPreviewHeader } from '../DatasetPreviewHeader';
import { NewRowActions } from '../NewRowActions';

import styles from './DatasetPreview.module.scss';

type DatasetPreviewProps = {
    selectedDataset: DatasetMetadata | undefined;
};

export const DatasetPreview = ({ selectedDataset }: DatasetPreviewProps) => {
    const [rowsOffset, setRowsOffset] = useState(0);
    const [displayEdits, setDisplayEdits] = useState<
        Map<string, Record<string, unknown>>
    >(new Map());
    const pendingEditsRef = useRef<Map<string, Record<string, unknown>>>(new Map());
    const [isInsertingRow, setIsInsertingRow] = useState(false);
    const [newRowValues, setNewRowValues] = useState<Record<string, string>>({});
    const wrapRef = useRef<HTMLDivElement>(null);
    const [gridWidth, setGridWidth] = useState(0);

    const [updateRow] = useUpdateRowMutation();
    const [insertRow, insertState] = useInsertRowMutation();

    const rowsQuery = useGetDatasetRowsQuery(
        selectedDataset
            ? {
                  datasetId: selectedDataset.dataset.id,
                  offset: rowsOffset,
                  limit: ROWS_PAGE_SIZE,
              }
            : skipToken
    );

    const columns = selectedDataset?.columns ?? [];
    const rows = rowsQuery.data?.rows ?? [];
    const totalRows = rowsQuery.data?.totalRows ?? selectedDataset?.totalRows ?? 0;
    const hasPreviousRows = rowsOffset > 0;
    const hasNextRows = rowsOffset + ROWS_PAGE_SIZE < totalRows;
    const lastPageOffset =
        totalRows === 0
            ? 0
            : Math.floor((totalRows - 1) / ROWS_PAGE_SIZE) * ROWS_PAGE_SIZE;
    const isOnLastPage = totalRows === 0 || rowsOffset >= lastPageOffset;
    const showAddRow = !hasNextRows && !!selectedDataset && !!rowsQuery.data;

    const rowCount = rows.length + (isInsertingRow ? 1 : 0);
    const gridHeight = Math.min(HEADER_H + rowCount * ROW_H, MAX_GRID_H);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) {
            return;
        }

        const ro = new ResizeObserver(([e]) =>
            setGridWidth(Math.floor(e.contentRect.width))
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
                hasPreviousRows={hasPreviousRows}
                hasNextRows={hasNextRows}
                isFetching={rowsQuery.isFetching}
                isOnLastPage={isOnLastPage}
                lastPageOffset={lastPageOffset}
                rowsOffset={rowsOffset}
                totalRows={totalRows}
                onRowsOffsetChange={setRowsOffset}
            />

            {!selectedDataset && (
                <PanelPlaceholder>Select a dataset to preview rows.</PanelPlaceholder>
            )}

            {selectedDataset && rowsQuery.isLoading && (
                <StatusMessage>Loading rows...</StatusMessage>
            )}

            {selectedDataset && rowsQuery.data && (
                <>
                    <DatasetGrid
                        columns={columns}
                        rows={rows}
                        displayEdits={displayEdits}
                        isInsertingRow={isInsertingRow}
                        newRowValues={newRowValues}
                        gridWidth={gridWidth}
                        gridHeight={gridHeight}
                        wrapRef={wrapRef}
                        onCellCommit={commitCell}
                        onNewRowValueChange={setNewRowValues}
                    />

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
                </>
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
