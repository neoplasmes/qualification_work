import type * as GridModule from '@glideapps/glide-data-grid';
import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import type { DatasetGridEditorProps } from '../../types';
import { DatasetGridEditor } from './DatasetGridEditor';

const grid = vi.hoisted(() => ({
    getCellContent: undefined as unknown as (item: [number, number]) => { data: string },
    scrollTo: vi.fn(),
}));
vi.mock('../../model', () => ({
    useDatasetTableOptions: () => ({
        widths: {},
        isHydrated: true,
        setColumnWidth: vi.fn(),
    }),
}));
vi.mock('@glideapps/glide-data-grid', async importOriginal => {
    const original = await importOriginal<typeof GridModule>();

    return {
        ...original,
        default: (props: {
            ref: { current: unknown };
            getCellContent: typeof grid.getCellContent;
        }) => {
            props.ref.current = { scrollTo: grid.scrollTo };
            grid.getCellContent = props.getCellContent;

            return null;
        },
    };
});
const props: DatasetGridEditorProps = {
    datasetId: 'dataset',
    columns: [
        {
            ref: 'datasetColumn:org/dataset/amount',
            id: 'amount',
            datasetId: 'dataset',
            key: 'amount',
            displayName: 'Amount',
            dataType: 'number',
            orderIndex: 0,
            isAnalyzable: true,
        },
    ],
    totalRows: 451,
    getRowAt: () => ({
        ref: 'datasetRow:org/dataset/row',
        id: 'row',
        datasetId: 'dataset',
        rowIndex: 0,
        data: { amount: 10 },
    }),
    displayEdits: new Map(),
    invalidCellKeys: new Set(),
    gridWidth: 600,
    gridHeight: 500,
    scrollToBottomSignal: 0,
    gridSelection: {
        columns: { toArray: () => [] },
        rows: { toArray: () => [] },
    } as unknown as DatasetGridEditorProps['gridSelection'],
    onGridSelectionChange: vi.fn(),
    onCellCommit: vi.fn(),
    onRowContextMenu: vi.fn(),
    onColumnContextMenu: vi.fn(),
    onVisibleRangeChange: vi.fn(),
};

it('shows a present null override and a cleared complete row as blank', () => {
    const { rerender } = render(
        <DatasetGridEditor
            {...props}
            displayEdits={new Map([['row', { amount: null }]])}
        />
    );
    expect(grid.getCellContent([0, 0]).data).toBe('');
    rerender(
        <DatasetGridEditor
            {...props}
            getRowAt={() => ({ ...props.getRowAt(0)!, data: {} })}
        />
    );
    expect(grid.getCellContent([0, 0]).data).toBe('');
});

it('consumes a scroll request once when authoritative totals change', () => {
    grid.scrollTo.mockClear();
    const { rerender } = render(
        <DatasetGridEditor {...props} scrollToBottomSignal={1} />
    );
    expect(grid.scrollTo).toHaveBeenCalledTimes(1);
    rerender(<DatasetGridEditor {...props} scrollToBottomSignal={1} totalRows={452} />);
    expect(grid.scrollTo).toHaveBeenCalledTimes(1);
    rerender(<DatasetGridEditor {...props} scrollToBottomSignal={2} totalRows={452} />);
    expect(grid.scrollTo).toHaveBeenCalledTimes(2);
});
