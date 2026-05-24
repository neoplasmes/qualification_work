import { skipToken } from '@reduxjs/toolkit/query';
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
import { useEffect, useRef, useState } from 'react';

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

type DatasetPreviewProps = {
    selectedDataset: DatasetMetadata | undefined;
};

// date-only: 2024-01-15
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
// datetime without timezone: 2024-01-15T10:30 or 2024-01-15T10:30:00.000
const DATETIME_NO_TZ_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

function isValidValue(value: string, dataType: DatasetColumn['dataType']): boolean {
    if (value === '') {return false;}
    if (dataType === 'number') {return !Number.isNaN(Number(value)) && Number.isFinite(Number(value));}
    if (dataType === 'bool') {return value === 'true' || value === 'false';}
    if (dataType === 'date') {
        const s = value.trim();
        if (DATE_ONLY_RE.test(s)) {return !Number.isNaN(new Date(`${s}T00:00:00.000Z`).getTime());}
        const normalized = DATETIME_NO_TZ_RE.test(s) ? `${s}Z` : s;
        return !Number.isNaN(new Date(normalized).getTime());
    }

    return true;
}

function parseValue(value: string, dataType: DatasetColumn['dataType']): unknown {
    if (dataType === 'number') {return Number(value);}
    if (dataType === 'bool') {return value === 'true';}
    if (dataType === 'date') {
        const s = value.trim();
        // date-only string: treat as UTC midnight to avoid timezone shift
        if (DATE_ONLY_RE.test(s)) {return `${s}T00:00:00.000Z`;}
        // datetime without timezone: append Z to keep UTC
        if (DATETIME_NO_TZ_RE.test(s)) {return new Date(`${s}Z`).toISOString();}
        return new Date(s).toISOString();
    }

    return value;
}

export const DatasetPreview = ({ selectedDataset }: DatasetPreviewProps) => {
    const [rowsOffset, setRowsOffset] = useState(0);
    const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [displayEdits, setDisplayEdits] = useState<Map<string, Record<string, unknown>>>(
        new Map()
    );
    const pendingEditsRef = useRef<Map<string, Record<string, unknown>>>(new Map());
    const [isInsertingRow, setIsInsertingRow] = useState(false);
    const [newRowValues, setNewRowValues] = useState<Record<string, string>>({});

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
    const totalRows = rowsQuery.data?.totalRows ?? selectedDataset?.totalRows ?? 0;
    const hasPreviousRows = rowsOffset > 0;
    const hasNextRows = rowsOffset + ROWS_PAGE_SIZE < totalRows;
    const lastPageOffset =
        totalRows === 0 ? 0 : Math.floor((totalRows - 1) / ROWS_PAGE_SIZE) * ROWS_PAGE_SIZE;
    const isOnLastPage = totalRows === 0 || rowsOffset >= lastPageOffset;
    const showAddRow = !hasNextRows && !!selectedDataset && !!rowsQuery.data;

    // flush pending cell edits every 1s
    useEffect(() => {
        if (!selectedDataset) {return;}
        const datasetId = selectedDataset.dataset.id;
        const orgId = selectedDataset.dataset.orgId;
        const id = setInterval(() => {
            if (!pendingEditsRef.current.size) {return;}
            const batch = new Map(pendingEditsRef.current);
            pendingEditsRef.current.clear();
            for (const [rowId, values] of batch) {
                void updateRow({ datasetId, orgId, rowId, values });
            }
        }, 1000);

        return () => clearInterval(id);
    }, [selectedDataset?.dataset.id, updateRow]);

    const commitCell = (rowId: string, colKey: string, rawValue: string) => {
        const col = columns.find(c => c.key === colKey);
        if (!col) {return;}
        // non-empty value must pass format validation - reject silently if not
        if (rawValue !== '' && !isValidValue(rawValue, col.dataType)) {return;}

        const parsed = rawValue === '' ? null : parseValue(rawValue, col.dataType);

        const pending = { ...pendingEditsRef.current.get(rowId) };
        pending[colKey] = parsed;
        pendingEditsRef.current.set(rowId, pending);

        setDisplayEdits(prev => {
            const next = new Map(prev);
            const row = { ...next.get(rowId) };
            row[colKey] = parsed;
            next.set(rowId, row);

            return next;
        });
    };

    const handleCellClick = (rowId: string, colKey: string, currentValue: unknown) => {
        if (editingCell) {
            commitCell(editingCell.rowId, editingCell.colKey, editingValue);
        }
        setEditingCell({ rowId, colKey });
        // use formatted display value so dates start without timezone suffix
        setEditingValue(formatChartCell(currentValue));
    };

    const handleCellBlur = () => {
        if (!editingCell) {return;}
        commitCell(editingCell.rowId, editingCell.colKey, editingValue);
        setEditingCell(null);
    };

    const handleCellKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCellBlur();
        }
        if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    const editingCol = editingCell ? columns.find(c => c.key === editingCell.colKey) : null;
    const isEditingInvalid =
        editingValue !== '' &&
        editingCol != null &&
        !isValidValue(editingValue, editingCol.dataType);

    const handleInsertConfirm = async () => {
        if (!selectedDataset) {return;}
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
                <div className={styles['table-wrap']}>
                    <table className={styles['table']}>
                        <thead>
                            <tr>
                                <th></th>
                                {columns.map(column => (
                                    <th key={column.id}>
                                        <div className={styles['th-inner']}>
                                            <span>{column.displayName}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rowsQuery.data.rows.map(row => (
                                <tr key={row.id}>
                                    <td>{row.rowIndex + 1}</td>
                                    {columns.map(column => {
                                        const isEditing =
                                            editingCell?.rowId === row.id &&
                                            editingCell?.colKey === column.key;
                                        const displayValue =
                                            displayEdits.get(row.id)?.[column.key] ??
                                            row.data[column.key];

                                        return (
                                            <td
                                                key={column.id}
                                                className={`${styles['td-editable']}${isEditing ? ` ${styles['td-editing']}` : ''}`}
                                                onDoubleClick={() => {
                                                    if (!isEditing) {
                                                        handleCellClick(row.id, column.key, displayValue);
                                                    }
                                                }}
                                            >
                                                <div className={styles['td-inner']}>
                                                    {isEditing ? (
                                                        <textarea
                                                            ref={el => {
                                                                if (el) {
                                                                    el.focus();
                                                                    el.setSelectionRange(
                                                                        el.value.length,
                                                                        el.value.length
                                                                    );
                                                                }
                                                            }}
                                                            className={`${styles['td-input']}${isEditingInvalid ? ` ${styles['td-input--invalid']}` : ''}`}
                                                            value={editingValue}
                                                            onChange={e =>
                                                                setEditingValue(e.target.value)
                                                            }
                                                            onBlur={handleCellBlur}
                                                            onKeyDown={handleCellKeyDown}
                                                        />
                                                    ) : (
                                                        <span>{formatChartCell(displayValue)}</span>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}

                            {isInsertingRow && (
                                <>
                                    <tr className={styles['new-row']}>
                                        <td></td>
                                        {columns.map(column => {
                                            const newVal = newRowValues[column.key] ?? '';
                                            const isNewInvalid =
                                                newVal !== '' &&
                                                !isValidValue(newVal, column.dataType);
                                            return (
                                            <td key={column.id}>
                                                <div className={styles['td-inner']}>
                                                    <input
                                                        className={`${styles['td-input']}${isNewInvalid ? ` ${styles['td-input--invalid']}` : ''}`}
                                                        placeholder={column.dataType}
                                                        value={newVal}
                                                        onChange={e =>
                                                            setNewRowValues(prev => ({
                                                                ...prev,
                                                                [column.key]: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                </div>
                                            </td>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        <td
                                            colSpan={columns.length + 1}
                                            className={styles['new-row-actions']}
                                        >
                                            <div className={styles['new-row-actions']}>
                                                <IconButton
                                                    aria-label="Confirm insert"
                                                    disabled={
                                                        !isNewRowValid || insertState.isLoading
                                                    }
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
                                        </td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>

                    {rowsQuery.data.rows.length === 0 && !isInsertingRow && (
                        <div className={styles['empty']}>
                            <FileSpreadsheet size={22} />
                            Dataset has no preview rows.
                        </div>
                    )}
                </div>
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
