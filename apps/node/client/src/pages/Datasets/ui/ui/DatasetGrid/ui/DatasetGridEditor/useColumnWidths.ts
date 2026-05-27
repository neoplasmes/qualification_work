import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_PREFIX = 'dataset-col-widths:';

const storageKey = (datasetId: string) => `${STORAGE_PREFIX}${datasetId}`;

const readStored = (datasetId: string): Record<string, number> => {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const raw = window.localStorage.getItem(storageKey(datasetId));
        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object') {
            return {};
        }

        // keep only numeric entries
        const out: Record<string, number> = {};
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
                out[k] = v;
            }
        }

        return out;
    } catch {
        return {};
    }
};

/**
 * Per-dataset column widths persisted to localStorage
 *
 * @param datasetId
 * @returns
 */
export const useColumnWidths = (datasetId: string | undefined) => {
    const [widths, setWidths] = useState<Record<string, number>>(() =>
        datasetId ? readStored(datasetId) : {}
    );

    // reload when dataset changes
    useEffect(() => {
        setWidths(datasetId ? readStored(datasetId) : {});
    }, [datasetId]);

    // debounce writes to avoid hammering localStorage during drag
    const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(
        () => () => {
            if (writeTimerRef.current) {
                clearTimeout(writeTimerRef.current);
            }
        },
        []
    );

    const setColumnWidth = useCallback(
        (columnKey: string, width: number) => {
            setWidths(prev => {
                if (prev[columnKey] === width) {
                    return prev;
                }

                const next = { ...prev, [columnKey]: width };

                if (datasetId && typeof window !== 'undefined') {
                    if (writeTimerRef.current) {
                        clearTimeout(writeTimerRef.current);
                    }
                    writeTimerRef.current = setTimeout(() => {
                        try {
                            window.localStorage.setItem(
                                storageKey(datasetId),
                                JSON.stringify(next)
                            );
                        } catch {
                            // ignore quota errors
                        }
                    }, 150);
                }

                return next;
            });
        },
        [datasetId]
    );

    return { widths, setColumnWidth };
};
