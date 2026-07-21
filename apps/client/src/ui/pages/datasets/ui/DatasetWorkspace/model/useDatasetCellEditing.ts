import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { debounce } from 'es-toolkit/function';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { useUpdateRowMutation } from '@/entities/dataset';

import { datasetCellValueHandlers } from '../lib';

const editFlushDelayMs = 700;

/**
 * keeps grid cell edits responsive while batching valid changes into delayed row patches
 *
 * @param selectedDataset - dataset whose rows can receive patches
 * @param deleteMenuOpen - prevents flushing edits while delete confirmation is active
 * @returns cell display overrides, invalid cell markers, commit handler and reset action
 */
export const useDatasetCellEditing = (
    selectedDataset: DatasetMetadata | undefined,
    deleteMenuOpen: boolean
) => {
    const [displayEdits, setDisplayEdits] = useState<
        Map<string, Record<string, unknown>>
    >(new Map());
    const [invalidCellKeys, setInvalidCellKeys] = useState<Set<string>>(new Set());
    const pendingEditsRef = useRef<Map<string, Record<string, unknown>>>(new Map());
    const deleteMenuOpenRef = useRef(deleteMenuOpen);
    const datasetRef = useRef<{ datasetId: string; orgId: string } | null>(null);
    const [updateRow] = useUpdateRowMutation();

    const resetCellEditing = useCallback(() => {
        setDisplayEdits(new Map());
        setInvalidCellKeys(new Set());
        pendingEditsRef.current.clear();
    }, []);

    const flushPendingEdits = useCallback(() => {
        const dataset = datasetRef.current;
        if (!dataset || deleteMenuOpenRef.current || !pendingEditsRef.current.size) {
            return;
        }

        const batch = pendingEditsRef.current;
        pendingEditsRef.current = new Map();
        for (const [rowId, values] of batch) {
            if (Object.keys(values).length) {
                void updateRow({
                    datasetId: dataset.datasetId,
                    orgId: dataset.orgId,
                    rowIds: [rowId],
                    values,
                });
            }
        }
    }, [updateRow]);

    const debouncedFlush = useMemo(
        () => debounce(flushPendingEdits, editFlushDelayMs),
        [flushPendingEdits]
    );

    useEffect(() => {
        return () => debouncedFlush.cancel();
    }, [debouncedFlush]);

    useEffect(() => {
        deleteMenuOpenRef.current = deleteMenuOpen;
        if (!deleteMenuOpen) {
            debouncedFlush();
        }
    }, [debouncedFlush, deleteMenuOpen]);

    useEffect(() => {
        datasetRef.current = selectedDataset
            ? {
                  datasetId: selectedDataset.dataset.id,
                  orgId: selectedDataset.dataset.orgId,
              }
            : null;
        resetCellEditing();
    }, [resetCellEditing, selectedDataset?.dataset.id, selectedDataset?.dataset.orgId]);

    const commitCell = useCallback(
        (rowId: string, col: DatasetColumn, rawValue: string) => {
            const cellValueHandler = datasetCellValueHandlers[col.dataType];
            const isValid = rawValue === '' || cellValueHandler.isValid(rawValue);
            const displayValue = isValid
                ? rawValue === ''
                    ? null
                    : cellValueHandler.parse(rawValue)
                : rawValue;
            const cellKey = `${rowId}:${col.key}`;

            setDisplayEdits(prev => {
                const next = new Map(prev);
                const row = { ...next.get(rowId) };
                row[col.key] = displayValue;
                next.set(rowId, row);

                return next;
            });

            setInvalidCellKeys(prev => {
                const next = new Set(prev);
                if (isValid) {
                    next.delete(cellKey);
                } else {
                    next.add(cellKey);
                }

                return next;
            });

            const pending = { ...pendingEditsRef.current.get(rowId) };
            if (isValid) {
                pending[col.key] = displayValue;
            } else {
                delete pending[col.key];
            }

            if (Object.keys(pending).length) {
                pendingEditsRef.current.set(rowId, pending);
            } else {
                pendingEditsRef.current.delete(rowId);
            }

            if (isValid) {
                debouncedFlush();
            }
        },
        [debouncedFlush]
    );

    return {
        displayEdits,
        invalidCellKeys,
        commitCell,
        resetCellEditing,
    };
};
