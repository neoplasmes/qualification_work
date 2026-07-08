import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { IdbDatasetTableOptionsRepo } from '../model/idb.datasetTableOptions.repo';
import { useDatasetTableOptions } from './useDatasetTableOptions';

describe('useDatasetTableOptions', () => {
    it('hydrates widths from storage on mount', async () => {
        await new IdbDatasetTableOptionsRepo().set('ds-hydrate', {
            columnWidths: { a: 111 },
        });

        const { result } = renderHook(() => useDatasetTableOptions('ds-hydrate'));

        expect(result.current.isHydrated).toBe(false);

        await waitFor(() => expect(result.current.widths).toEqual({ a: 111 }));
        expect(result.current.isHydrated).toBe(true);
    });

    it('updates widths immediately and persists them', async () => {
        const { result } = renderHook(() => useDatasetTableOptions('ds-save'));

        act(() => result.current.setColumnWidth('a', 222));

        expect(result.current.widths).toEqual({ a: 222 });

        await waitFor(async () => {
            const stored = await new IdbDatasetTableOptionsRepo().get('ds-save');
            expect(stored?.columnWidths).toEqual({ a: 222 });
        });
    });
});
