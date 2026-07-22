import { CompactSelection } from '@glideapps/glide-data-grid';

import type { DatasetGridProps } from '../../DatasetGrid';

export const DatasetWorkspaceTestGrid = ({
    columns,
    onCellCommit,
    onRowContextMenu,
    onColumnContextMenu,
    onGridSelectionChange,
    displayEdits,
    invalidCellKeys,
    getRowAt,
}: DatasetGridProps) => {
    const draft = displayEdits.get('row-1');
    const amount =
        draft && Object.hasOwn(draft, 'amount') ? draft.amount : getRowAt(0)?.data.amount;

    return (
        <div data-testid="mock-grid">
            <output aria-label="first amount">{String(amount ?? '')}</output>
            <output aria-label="first invalid">
                {String(invalidCellKeys.has('row-1:amount'))}
            </output>
            <button type="button" onClick={() => onCellCommit('row-1', columns[0], '84')}>
                Commit newer amount
            </button>
            <button type="button" onClick={() => onCellCommit('row-3', columns[0], '99')}>
                Commit unrelated amount
            </button>
            <button type="button" onClick={() => onCellCommit('row-1', columns[0], '42')}>
                Commit amount
            </button>
            <button
                type="button"
                onClick={() => onCellCommit('row-1', columns[0], 'oops')}
            >
                Commit invalid amount
            </button>
            <button type="button" onClick={() => onCellCommit('row-1', columns[0], '')}>
                Clear amount
            </button>
            <button
                type="button"
                onClick={() =>
                    onGridSelectionChange({
                        columns: CompactSelection.empty(),
                        rows: CompactSelection.empty(),
                        current: {
                            cell: [0, 0],
                            range: { x: 0, y: 0, width: 1, height: 2 },
                            rangeStack: [],
                        },
                    })
                }
            >
                Select two rows
            </button>
            <button type="button" onClick={() => onRowContextMenu(0, { x: 12, y: 24 })}>
                Open row menu
            </button>
            <button
                type="button"
                onClick={() => onColumnContextMenu(columns[0], { x: 20, y: 36 })}
            >
                Open column menu
            </button>
        </div>
    );
};
