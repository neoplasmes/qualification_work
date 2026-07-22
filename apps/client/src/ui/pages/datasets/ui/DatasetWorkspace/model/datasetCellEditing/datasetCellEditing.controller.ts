import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { useCommand } from '@/env/cache/useCommand';
import { useDependencies } from '@/ui/di/dependencies';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { datasetCellValueHandlers } from '../../lib';

const editFlushDelayMs = 700;
type Draft = { value: unknown; revision: number; valid: boolean };

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
    const dependencies = useDependencies();
    const {
        execute: updateRow,
        error,
        syncError,
    } = useCommand(dependencies.updateDatasetRows);
    const [displayEdits, setDisplayEdits] = useState<
        Map<string, Record<string, unknown>>
    >(new Map());
    const [invalidCellKeys, setInvalidCellKeys] = useState<Set<string>>(new Set());
    const pending = useRef(new Map<string, Record<string, Draft>>());
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    const inflight = useRef(new Set<string>());
    const queued = useRef(new Set<string>());
    const revision = useRef(0);
    const generation = useRef(0);
    const menuOpen = useRef(deleteMenuOpen);
    const flush = useRef<(rowId: string) => Promise<void>>(async () => {});
    const orgId = selectedDataset?.dataset.orgId;
    const datasetId = selectedDataset?.dataset.id;

    const resetCellEditing = useCallback((rowIds?: string[]) => {
        if (rowIds) {
            for (const id of rowIds) {
                clearTimeout(timers.current.get(id));
                timers.current.delete(id);
                pending.current.delete(id);
                queued.current.delete(id);
            }
            setDisplayEdits(current => {
                const next = new Map(current);
                for (const id of rowIds) {
                    next.delete(id);
                }

                return next;
            });
            setInvalidCellKeys(
                current =>
                    new Set(
                        [...current].filter(
                            key => !rowIds.some(id => key.startsWith(`${id}:`))
                        )
                    )
            );

            return;
        }
        generation.current++;
        for (const timer of timers.current.values()) {
            clearTimeout(timer);
        }
        timers.current.clear();
        pending.current.clear();
        inflight.current.clear();
        queued.current.clear();
        setDisplayEdits(new Map());
        setInvalidCellKeys(new Set());
    }, []);

    const flushRow = useCallback(
        async (rowId: string) => {
            timers.current.delete(rowId);
            if (!orgId || !datasetId || menuOpen.current) {
                return;
            }
            if (inflight.current.has(rowId)) {
                queued.current.add(rowId);

                return;
            }
            const sent = Object.entries(pending.current.get(rowId) ?? {}).filter(
                ([, draft]) => draft.valid
            );
            if (!sent.length) {
                return;
            }
            const version = generation.current;
            inflight.current.add(rowId);
            try {
                const rows = await updateRow({
                    orgId,
                    datasetId,
                    rowIds: [rowId],
                    values: Object.fromEntries(
                        sent.map(([key, draft]) => [key, draft.value])
                    ),
                });
                if (
                    version !== generation.current ||
                    !rows.some(row => row.id === rowId)
                ) {
                    return;
                }
                const drafts = pending.current.get(rowId);
                const cleared = new Set<string>();
                for (const [key, draft] of sent) {
                    if (drafts?.[key]?.revision === draft.revision) {
                        delete drafts[key];
                        cleared.add(key);
                    }
                }
                if (drafts && !Object.keys(drafts).length) {
                    pending.current.delete(rowId);
                }
                setDisplayEdits(current => {
                    const next = new Map(current);
                    const row = { ...next.get(rowId) };
                    for (const key of cleared) {
                        delete row[key];
                    }
                    if (Object.keys(row).length) {
                        next.set(rowId, row);
                    } else {
                        next.delete(rowId);
                    }

                    return next;
                });
            } catch {
                // failed drafts remain available for correction
            } finally {
                if (version === generation.current) {
                    inflight.current.delete(rowId);
                    if (queued.current.delete(rowId)) {
                        void flush.current(rowId);
                    }
                }
            }
        },
        [orgId, datasetId, updateRow]
    );

    useEffect(() => {
        flush.current = flushRow;
    }, [flushRow]);
    useEffect(() => {
        resetCellEditing();

        return () => {
            generation.current++;
            for (const timer of timers.current.values()) {
                clearTimeout(timer);
            }
            timers.current.clear();
        };
    }, [orgId, datasetId, resetCellEditing]);
    useEffect(() => {
        menuOpen.current = deleteMenuOpen;
        if (!deleteMenuOpen) {
            for (const rowId of pending.current.keys()) {
                if (timers.current.has(rowId)) {
                    clearTimeout(timers.current.get(rowId));
                }
                timers.current.set(
                    rowId,
                    setTimeout(() => {
                        void flush.current(rowId);
                    }, editFlushDelayMs)
                );
            }
        }
    }, [deleteMenuOpen]);

    const commitCell = useCallback(
        (rowId: string, column: DatasetColumn, rawValue: string) => {
            const handler = datasetCellValueHandlers[column.dataType];
            const valid = rawValue === '' || handler.isValid(rawValue);
            const value = valid
                ? rawValue === ''
                    ? null
                    : handler.parse(rawValue)
                : rawValue;
            const row = pending.current.get(rowId) ?? {};
            row[column.key] = { value, valid, revision: ++revision.current };
            pending.current.set(rowId, row);
            setDisplayEdits(current =>
                new Map(current).set(rowId, {
                    ...current.get(rowId),
                    [column.key]: value,
                })
            );
            setInvalidCellKeys(current => {
                const next = new Set(current);
                if (valid) {
                    next.delete(`${rowId}:${column.key}`);
                } else {
                    next.add(`${rowId}:${column.key}`);
                }

                return next;
            });
            if (valid) {
                if (timers.current.has(rowId)) {
                    clearTimeout(timers.current.get(rowId));
                }
                timers.current.set(
                    rowId,
                    setTimeout(() => {
                        void flush.current(rowId);
                    }, editFlushDelayMs)
                );
            }
        },
        []
    );

    return {
        displayEdits,
        invalidCellKeys,
        commitCell,
        resetCellEditing,
        error,
        syncError,
    };
};
