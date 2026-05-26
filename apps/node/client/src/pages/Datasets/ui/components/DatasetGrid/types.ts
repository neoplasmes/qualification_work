import type { Dispatch, SetStateAction } from 'react';

import type { DatasetColumn, DatasetRow } from '@/entities/dataset';

export type InsertRowDraft = {
    afterRowId: string;
    visualIndex: number;
    values: Record<string, string>;
};

export type DatasetGridProps = {
    columns: DatasetColumn[];
    rows: DatasetRow[];
    displayEdits: Map<string, Record<string, unknown>>;
    insertDraft: InsertRowDraft | null;
    gridWidth: number;
    gridHeight: number;
    hasMore: boolean;
    onCellCommit: (rowId: string, column: DatasetColumn, rawValue: string) => void;
    onDraftValueChange: Dispatch<SetStateAction<Record<string, string>>>;
    onRowContextMenu: (rowIndex: number, position: { x: number; y: number }) => void;
    onLoadMore: () => void;
};

export type DatasetGridEditorProps = DatasetGridProps;
