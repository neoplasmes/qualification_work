import type { Dispatch, SetStateAction } from 'react';

import type { DatasetColumn, DatasetRow } from '@/entities/dataset';

export type InsertRowDraft = {
    afterRowId: string;
    visualIndex: number;
    values: Record<string, string>;
};

export type DraftRowBounds = {
    y: number;
    height: number;
};

export type DatasetGridProps = {
    datasetId: string;
    columns: DatasetColumn[];
    totalRows: number;
    getRowAt: (absIndex: number) => DatasetRow | undefined;
    displayEdits: Map<string, Record<string, unknown>>;
    insertDraft: InsertRowDraft | null;
    gridWidth: number;
    gridHeight: number;
    // counter; on change the grid scrolls to last row
    scrollToBottomSignal: number;
    onCellCommit: (rowId: string, column: DatasetColumn, rawValue: string) => void;
    onDraftValueChange: Dispatch<SetStateAction<Record<string, string>>>;
    onRowContextMenu: (rowIndex: number, position: { x: number; y: number }) => void;
    onColumnContextMenu: (
        column: DatasetColumn,
        position: { x: number; y: number }
    ) => void;
    onDraftRowBoundsChange: (bounds: DraftRowBounds | null) => void;
    onVisibleRangeChange: (startRow: number, endRow: number) => void;
};

export type DatasetGridEditorProps = DatasetGridProps;
