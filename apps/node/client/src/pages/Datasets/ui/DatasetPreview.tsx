import { skipToken } from '@reduxjs/toolkit/query';
import DataEditor, {
    GridCellKind,
    type EditableGridCell,
    type GridCell,
    type GridColumn,
    type Item,
    type Theme,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import {
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    FileSpreadsheet,
    Plus,
    Table2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    useGetDatasetRowsQuery,
    useInsertRowMutation,
    useUpdateRowMutation,
    type DatasetColumn,
    type DatasetMetadata,
} from '@/features/datasets';

import { formatChartCell } from '@/entities/chart';

import { IconButton } from '@/shared/ui';

import styles from './DatasetsPage.module.scss';

const ROWS_PAGE_SIZE = 200;
const HEADER_H = 40;
const ROW_H = 34;
const MAX_GRID_H = 520;

// date-only: 2024-01-15
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
// datetime without timezone: 2024-01-15T10:30 or 2024-01-15T10:30:00.000
const DATETIME_NO_TZ_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

const GRID_THEME: Partial<Theme> = {
    accentColor: '#872557',
    accentFg: '#ffffff',
    accentLight: 'rgba(135,37,87,0.12)',
    textDark: '#ffffff',
    textMedium: '#b0b0b0',
    textLight: '#8c8c8c',
    textBubble: '#ffffff',
    bgIconHeader: '#1a1a1a',
    fgIconHeader: '#b0b0b0',
    textHeader: '#ffffff',
    textHeaderSelected: '#ffffff',
    bgCell: '#111111',
    bgCellMedium: 'rgba(255,255,255,0.025)',
    bgHeader: '#1a1a1a',
    bgHeaderHasFocus: '#1a1a1a',
    bgHeaderHovered: '#242424',
    bgBubble: '#1a1a1a',
    bgBubbleSelected: '#242424',
    bgSearchResult: 'rgba(135,37,87,0.2)',
    borderColor: '#2c2a2b',
    drilldownBorder: '#2c2a2b',
    linkColor: '#872557',
    cellHorizontalPadding: 12,
    cellVerticalPadding: 8,
    headerFontStyle: 'bold 11px',
    headerIconSize: 16,
    baseFontStyle: '13px',
    markerFontStyle: '11px',
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    editorFontSize: '13px',
    lineHeight: 1.4,
    horizontalBorderColor: '#2c2a2b',
    headerBottomBorderColor: '#2c2a2b',
};

function isValidValue(value: string, dataType: DatasetColumn['dataType']): boolean {
    if (value === '') {
        return false;
    }

    if (dataType === 'number') {
        return !Number.isNaN(Number(value)) && Number.isFinite(Number(value));
    }

    if (dataType === 'bool') {
        return value === 'true' || value === 'false';
    }

    if (dataType === 'date') {
        const s = value.trim();

        if (DATE_ONLY_RE.test(s)) {
            return !Number.isNaN(new Date(`${s}T00:00:00.000Z`).getTime());
        }

        const normalized = DATETIME_NO_TZ_RE.test(s) ? `${s}Z` : s;

        return !Number.isNaN(new Date(normalized).getTime());
    }

    return true;
}

function parseValue(value: string, dataType: DatasetColumn['dataType']): unknown {
    if (dataType === 'number') {
        return Number(value);
    }

    if (dataType === 'bool') {
        return value === 'true';
    }

    if (dataType === 'date') {
        const s = value.trim();
        // date-only string: treat as UTC midnight to avoid timezone shift
        if (DATE_ONLY_RE.test(s)) {
            return `${s}T00:00:00.000Z`;
        }

        // datetime without timezone: append Z to keep UTC
        if (DATETIME_NO_TZ_RE.test(s)) {
            return new Date(`${s}Z`).toISOString();
        }

        return new Date(s).toISOString();
    }

    return value;
}

type DatasetPreviewProps = {
    selectedDataset: DatasetMetadata | undefined;
};

export const DatasetPreview = ({ selectedDataset }: DatasetPreviewProps) => {
    const [rowsOffset, setRowsOffset] = useState(0);
    const [displayEdits, setDisplayEdits] = useState<Map<string, Record<string, unknown>>>(new Map());
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
        totalRows === 0 ? 0 : Math.floor((totalRows - 1) / ROWS_PAGE_SIZE) * ROWS_PAGE_SIZE;
    const isOnLastPage = totalRows === 0 || rowsOffset >= lastPageOffset;
    const showAddRow = !hasNextRows && !!selectedDataset && !!rowsQuery.data;

    const rowCount = rows.length + (isInsertingRow ? 1 : 0);
    const gridHeight = Math.min(HEADER_H + rowCount * ROW_H, MAX_GRID_H);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) {
            return;
        }

        const ro = new ResizeObserver(([e]) => setGridWidth(Math.floor(e.contentRect.width)));
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

    const commitCell = useCallback((rowId: string, col: DatasetColumn, rawValue: string) => {
        const parsed = rawValue === '' ? null : parseValue(rawValue, col.dataType);
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
    }, []);

    const gridColumns = useMemo<GridColumn[]>(
        () =>
            columns.map(col => ({
                id: col.key,
                title: col.displayName.toUpperCase(),
                width: 150,
                grow: 1,
            })),
        [columns]
    );

    const getCellContent = useCallback(
        ([colIdx, rowIdx]: Item): GridCell => {
            const col = columns[colIdx];
            if (!col) {
                return { kind: GridCellKind.Text, data: '', displayData: '', allowOverlay: false };
            }

            if (isInsertingRow && rowIdx === rows.length) {
                const val = newRowValues[col.key] ?? '';

                return { kind: GridCellKind.Text, data: val, displayData: val, allowOverlay: true };
            }

            const dataRow = rows[rowIdx];
            if (!dataRow) {
                return { kind: GridCellKind.Text, data: '', displayData: '', allowOverlay: false };
            }

            const rawValue = displayEdits.get(dataRow.id)?.[col.key] ?? dataRow.data[col.key];
            const display = formatChartCell(rawValue);

            return { kind: GridCellKind.Text, data: display, displayData: display, allowOverlay: true };
        },
        [columns, rows, displayEdits, isInsertingRow, newRowValues]
    );

    const onCellEdited = useCallback(
        ([colIdx, rowIdx]: Item, newValue: EditableGridCell) => {
            const col = columns[colIdx];
            if (!col || newValue.kind !== GridCellKind.Text) {
                return;
            }

            if (isInsertingRow && rowIdx === rows.length) {
                setNewRowValues(prev => ({ ...prev, [col.key]: newValue.data }));

                return;
            }

            const dataRow = rows[rowIdx];
            if (!dataRow) {
                return;
            }

            commitCell(dataRow.id, col, newValue.data);
        },
        [columns, rows, isInsertingRow, commitCell]
    );

    const validateCell = useCallback(
        ([colIdx]: Item, newValue: EditableGridCell): boolean => {
            const col = columns[colIdx];
            if (!col || newValue.kind !== GridCellKind.Text) {
                return true;
            }

            const val = newValue.data;

            return val === '' || isValidValue(val, col.dataType);
        },
        [columns]
    );

    const handleInsertConfirm = async () => {
        if (!selectedDataset) {
            return;
        }

        const data: Record<string, unknown> = {};
        for (const col of columns) {
            const raw = newRowValues[col.key] ?? '';
            if (raw !== '') {
                data[col.key] = parseValue(raw, col.dataType);
            }
        }
        try {
            await insertRow({
                datasetId: selectedDataset.dataset.id,
                orgId: selectedDataset.dataset.orgId,
                data,
            }).unwrap();
            setIsInsertingRow(false);
            setNewRowValues({});
        } catch {
            // silent - user can retry
        }
    };

    const isNewRowValid =
        columns.length > 0 && columns.every(c => isValidValue(newRowValues[c.key] ?? '', c.dataType));

    return (
        <section className={styles['preview']} aria-label="Dataset preview">
            <div className={styles['preview-header']}>
                <div data-stack="h" data-gap="sm" data-align="center">
                    <Table2 size={20} />
                    <span className={styles['eyebrow']}>Preview</span>
                </div>

                {selectedDataset && (
                    <div data-stack="h" data-gap="sm" data-align="center">
                        <IconButton
                            aria-label="Previous rows"
                            disabled={!hasPreviousRows || rowsQuery.isFetching}
                            onClick={() =>
                                setRowsOffset(offset => Math.max(0, offset - ROWS_PAGE_SIZE))
                            }
                        >
                            <ChevronLeft size={18} />
                        </IconButton>
                        <span className={styles['page-indicator']}>
                            {totalRows === 0
                                ? '0 rows'
                                : `${rowsOffset + 1}-${Math.min(
                                      rowsOffset + ROWS_PAGE_SIZE,
                                      totalRows
                                  )} of ${totalRows}`}
                        </span>
                        <IconButton
                            aria-label="Next rows"
                            disabled={!hasNextRows || rowsQuery.isFetching}
                            onClick={() => setRowsOffset(offset => offset + ROWS_PAGE_SIZE)}
                        >
                            <ChevronRight size={18} />
                        </IconButton>
                        <IconButton
                            aria-label="Last page"
                            disabled={isOnLastPage || rowsQuery.isFetching}
                            onClick={() => setRowsOffset(lastPageOffset)}
                        >
                            <ChevronsRight size={18} />
                        </IconButton>
                    </div>
                )}
            </div>

            {!selectedDataset && (
                <p className={styles['panel-placeholder']}>Select a dataset to preview rows.</p>
            )}

            {selectedDataset && rowsQuery.isLoading && (
                <div className={styles['status']}>Loading rows...</div>
            )}

            {selectedDataset && rowsQuery.data && (
                <>
                    <div
                        ref={wrapRef}
                        className={styles['table-wrap']}
                        data-testid="dataset-preview-grid"
                    >
                        {rows.length === 0 && !isInsertingRow ? (
                            <div className={styles['empty']}>
                                <FileSpreadsheet size={22} />
                                Dataset has no preview rows.
                            </div>
                        ) : (
                            gridWidth > 0 && (
                                <DataEditor
                                    theme={GRID_THEME}
                                    columns={gridColumns}
                                    rows={rowCount}
                                    getCellContent={getCellContent}
                                    onCellEdited={onCellEdited}
                                    validateCell={validateCell}
                                    rowMarkers="number"
                                    headerHeight={HEADER_H}
                                    rowHeight={ROW_H}
                                    width={gridWidth}
                                    height={gridHeight}
                                    cellActivationBehavior="double-click"
                                />
                            )
                        )}
                    </div>

                    {isInsertingRow && (
                        <div className={styles['new-row-actions']}>
                            <IconButton
                                aria-label="Confirm insert"
                                disabled={!isNewRowValid || insertState.isLoading}
                                onClick={() => void handleInsertConfirm()}
                            >
                                <Check size={16} />
                            </IconButton>
                            <IconButton
                                aria-label="Cancel insert"
                                variant="danger"
                                onClick={() => {
                                    setIsInsertingRow(false);
                                    setNewRowValues({});
                                }}
                            >
                                <X size={16} />
                            </IconButton>
                        </div>
                    )}
                </>
            )}

            {showAddRow && !isInsertingRow && (
                <button
                    type="button"
                    className={styles['add-row-button']}
                    onClick={() => setIsInsertingRow(true)}
                >
                    <Plus size={16} />
                    Add row
                </button>
            )}
        </section>
    );
};
