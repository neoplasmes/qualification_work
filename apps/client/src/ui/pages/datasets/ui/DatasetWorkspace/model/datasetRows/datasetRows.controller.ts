import { useReads } from '@/env/cache/useReads';
import { useDependencies } from '@/ui/di/dependencies';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { rowsPageSize } from '../../../../const';

/**
 * loads visible page compositions while row bodies remain in the canonical store
 *
 * @param scope - selected organization and dataset
 * @returns current row projections, authoritative totals and range loading
 */
export const useDatasetRowsController = ({
    orgId,
    datasetId,
    metadataTotalRows,
}: {
    orgId: string | undefined;
    datasetId: string | undefined;
    metadataTotalRows?: number;
}) => {
    const dependencies = useDependencies();
    const [, render] = useState(0);
    const chunks = useMemo(
        () => ({
            requested: new Set<number>(),
            loaded: new Set<number>(),
            pending: new Map<number, Promise<void>>(),
        }),
        [orgId, datasetId]
    );
    const offsets = [...chunks.requested].sort((a, b) => a - b);
    const chunkPositions = new Map(offsets.map((offset, index) => [offset, index]));
    const reads = useReads(
        dependencies.getDatasetRows,
        offsets.map(offset => ({
            orgId: orgId!,
            datasetId: datasetId!,
            offset,
            limit: rowsPageSize,
        }))
    );
    const [scrollToBottomSignal, setScrollToBottomSignal] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const totalRows =
        reads.find(read => read.data)?.data?.totalRows ?? metadataTotalRows ?? 0;

    const ensureRange = useCallback(
        async (start: number, end: number) => {
            if (!orgId || !datasetId || end < start || end < 0) {
                return;
            }
            const tasks: Promise<void>[] = [];
            for (
                let offset = Math.max(0, Math.floor(start / rowsPageSize)) * rowsPageSize;
                offset <= end;
                offset += rowsPageSize
            ) {
                if (chunks.loaded.has(offset)) {
                    continue;
                }
                let task = chunks.pending.get(offset);
                if (!task) {
                    chunks.requested.add(offset);
                    task = dependencies.cache
                        .read(dependencies.getDatasetRows, {
                            orgId,
                            datasetId,
                            offset,
                            limit: rowsPageSize,
                        })
                        .then(() => {
                            chunks.loaded.add(offset);
                        })
                        .finally(() => {
                            chunks.pending.delete(offset);
                        });
                    chunks.pending.set(offset, task);
                }
                tasks.push(task);
            }
            render(version => version + 1);
            await Promise.all(tasks);
        },
        [dependencies, orgId, datasetId, chunks]
    );

    useEffect(() => {
        setIsAtBottom(false);
        void ensureRange(0, 0).catch(() => {});
    }, [ensureRange]);

    const getRow = useCallback(
        (index: number) => {
            if (index < 0) {
                return undefined;
            }
            const offset = Math.floor(index / rowsPageSize) * rowsPageSize;

            const position = chunkPositions.get(offset);

            return position === undefined
                ? undefined
                : reads[position]?.data?.rows[index - offset];
        },
        [reads, chunkPositions]
    );

    const handleVisibleRangeChange = useCallback(
        (start: number, end: number) => {
            void ensureRange(start, end).catch(() => {});
            setIsAtBottom(totalRows > 0 && end >= totalRows - 1);
        },
        [ensureRange, totalRows]
    );
    const handleScrollToBottom = useCallback(async () => {
        if (totalRows <= 0) {
            return;
        }
        await ensureRange(totalRows - 1, totalRows - 1);
        setScrollToBottomSignal(signal => signal + 1);
    }, [ensureRange, totalRows]);

    return {
        getRow,
        ensureRange,
        totalRows,
        retry: async () => {
            chunks.loaded.clear();
            await Promise.all(
                [...chunks.requested].map(offset => ensureRange(offset, offset))
            );
        },
        isLoading:
            Boolean(datasetId && orgId) &&
            (!reads.length || reads.some(read => read.isPending)),
        error: reads.find(read => read.error)?.error ?? undefined,
        isAtBottom,
        scrollToBottomSignal,
        handleVisibleRangeChange,
        handleScrollToBottom,
    };
};
