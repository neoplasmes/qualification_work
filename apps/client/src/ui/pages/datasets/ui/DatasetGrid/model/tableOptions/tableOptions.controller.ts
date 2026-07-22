import { useCommand } from '@/env/cache/useCommand';
import { useDependencies } from '@/ui/di/dependencies';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ColumnWidths } from '@/app/ports/repos/datasetTableOptions';

const writeDebounceMs = 150;

/**
 * per-dataset column widths persisted to IndexedDB
 *
 * @param datasetId
 * @returns local widths and hydration status
 */
export const useDatasetTableOptions = (datasetId: string | undefined) => {
    const dependencies = useDependencies();
    const { execute: save, error } = useCommand(dependencies.saveDatasetTableOptions);
    const [state, setState] = useState<{
        datasetId: string | undefined;
        widths: ColumnWidths;
        hydrated: boolean;
    }>({ datasetId, widths: {}, hydrated: false });
    const widthsRef = useRef<ColumnWidths>({});
    const revision = useRef(0);
    const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // async hydrate on dataset change, guard against stale responses
    useEffect(() => {
        let active = true;
        const version = ++revision.current;
        widthsRef.current = {};
        setState({ datasetId, widths: {}, hydrated: !datasetId });
        if (datasetId) {
            void dependencies.cache
                .read(dependencies.getDatasetTableOptions, { datasetId })
                .then(
                    loaded => {
                        if (active) {
                            if (version === revision.current) {
                                widthsRef.current = loaded;
                            }
                            setState({
                                datasetId,
                                widths: widthsRef.current,
                                hydrated: true,
                            });
                        }
                    },
                    () => {
                        if (active) {
                            setState({
                                datasetId,
                                widths: widthsRef.current,
                                hydrated: true,
                            });
                        }
                    }
                );
        }

        return () => {
            active = false;
            if (writeTimerRef.current) {
                clearTimeout(writeTimerRef.current);
            }
        };
    }, [datasetId, dependencies]);

    // debounce writes to avoid hammering storage during drag
    const setColumnWidth = useCallback(
        (columnKey: string, width: number) => {
            if (
                !Number.isFinite(width) ||
                width <= 0 ||
                widthsRef.current[columnKey] === width
            ) {
                return;
            }
            revision.current++;
            const next = { ...widthsRef.current, [columnKey]: width };
            widthsRef.current = next;
            setState(current => ({ ...current, datasetId, widths: next }));
            if (datasetId) {
                if (writeTimerRef.current) {
                    clearTimeout(writeTimerRef.current);
                }
                writeTimerRef.current = setTimeout(() => {
                    void save({ datasetId, widths: next }).catch(() => {});
                }, writeDebounceMs);
            }
        },
        [datasetId, save]
    );

    // false while widths are loading, gates grid render to avoid a width jump
    return {
        widths: state.datasetId === datasetId ? state.widths : {},
        setColumnWidth,
        isHydrated: state.datasetId === datasetId && state.hydrated,
        error,
    };
};
