import { useCallback, useEffect, useRef, useState } from 'react';

import { useLazyGetDatasetRowsQuery, type DatasetRow } from '@/entities/dataset';

import { rowsPageSize } from '../../../const';

/**
 * keeps a paged row cache for the virtualized dataset grid and loads visible chunks on demand
 *
 * @param datasetId - selected dataset id that scopes cached chunks
 * @param metadataTotalRows - row count from dataset metadata used before chunk responses arrive
 * @returns cached chunks, total row state, row lookup and chunk loading handlers
 */
export const useDatasetRowsCache = (
    datasetId: string | undefined,
    metadataTotalRows: number | undefined
) => {
    const [loadedChunks, setLoadedChunks] = useState<Map<number, DatasetRow[]>>(
        () => new Map()
    );
    const loadedChunksRef = useRef<Map<number, DatasetRow[]>>(new Map());
    const [knownTotalRows, setKnownTotalRows] = useState<number | null>(null);
    const inflightChunksRef = useRef<Set<number>>(new Set());
    const [scrollToBottomSignal, setScrollToBottomSignal] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const [fetchRows] = useLazyGetDatasetRowsQuery();

    const totalRows = knownTotalRows ?? metadataTotalRows ?? 0;

    const resetRowsCache = useCallback(() => {
        loadedChunksRef.current = new Map();
        setLoadedChunks(loadedChunksRef.current);
        inflightChunksRef.current.clear();
        setKnownTotalRows(null);
        setIsAtBottom(false);
    }, []);

    useEffect(() => {
        resetRowsCache();
    }, [datasetId, resetRowsCache]);

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
                        offset: chunkIdx * rowsPageSize,
                        limit: rowsPageSize,
                    },
                    true
                ).unwrap();

                const next = new Map(loadedChunksRef.current);
                next.set(chunkIdx, res.rows);
                loadedChunksRef.current = next;
                setLoadedChunks(next);
                setKnownTotalRows(res.totalRows);
            } catch {
                return;
            } finally {
                inflightChunksRef.current.delete(chunkIdx);
            }
        },
        [datasetId, fetchRows]
    );

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

            const chunkIdx = Math.floor(absIndex / rowsPageSize);
            const offset = absIndex % rowsPageSize;

            return loadedChunks.get(chunkIdx)?.[offset];
        },
        [loadedChunks]
    );

    const handleVisibleRangeChange = useCallback(
        (startRow: number, endRow: number) => {
            const startChunk = Math.max(0, Math.floor(startRow / rowsPageSize));
            const endChunk = Math.max(0, Math.floor(endRow / rowsPageSize));
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

        const lastChunkIdx = Math.floor((totalRows - 1) / rowsPageSize);
        await requestChunk(lastChunkIdx);
        setScrollToBottomSignal(signal => signal + 1);
    }, [requestChunk, totalRows]);

    return {
        loadedChunks,
        totalRows,
        isAtBottom,
        scrollToBottomSignal,
        getRowAt,
        handleScrollToBottom,
        handleVisibleRangeChange,
        requestChunk,
        resetRowsCache,
    };
};
