import { useCallback, useEffect, useRef, useState } from 'react';

import type { ColumnWidths } from '../model/datasetTableOptions.repo';
import { DatasetTableOptionsService } from '../model/datasetTableOptions.service';
import { IdbDatasetTableOptionsRepo } from '../model/idb.datasetTableOptions.repo';

// composition root: single shared service over the idb repo
const service = new DatasetTableOptionsService(new IdbDatasetTableOptionsRepo());

const WRITE_DEBOUNCE_MS = 150;

/**
 * Per-dataset column widths persisted to IndexedDB
 *
 * @param datasetId
 * @returns
 */
export const useDatasetTableOptions = (datasetId: string | undefined) => {
    const [widths, setWidths] = useState<ColumnWidths>({});
    // false while widths are loading, gates grid render to avoid a width jump
    const [isHydrated, setIsHydrated] = useState(false);

    // async hydrate on dataset change, guard against stale responses
    useEffect(() => {
        if (!datasetId) {
            setWidths({});
            setIsHydrated(true);

            return;
        }

        let active = true;
        setIsHydrated(false);
        service.getColumnWidths(datasetId).then(loaded => {
            if (active) {
                setWidths(loaded);
                setIsHydrated(true);
            }
        });

        return () => {
            active = false;
        };
    }, [datasetId]);

    // debounce writes to avoid hammering storage during drag
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

                if (datasetId) {
                    if (writeTimerRef.current) {
                        clearTimeout(writeTimerRef.current);
                    }
                    writeTimerRef.current = setTimeout(() => {
                        void service.saveColumnWidths(datasetId, next);
                    }, WRITE_DEBOUNCE_MS);
                }

                return next;
            });
        },
        [datasetId]
    );

    return { widths, setColumnWidth, isHydrated };
};
