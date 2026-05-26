import type { Dispatch, RefObject, SetStateAction } from 'react';

import type { DatasetColumn, DatasetRow } from '@/entities/dataset';

export type DatasetGridProps = {
    columns: DatasetColumn[];
    rows: DatasetRow[];
    displayEdits: Map<string, Record<string, unknown>>;
    isInsertingRow: boolean;
    newRowValues: Record<string, string>;
    gridWidth: number;
    gridHeight: number;
    wrapRef: RefObject<HTMLDivElement | null>;
    onCellCommit: (rowId: string, column: DatasetColumn, rawValue: string) => void;
    onNewRowValueChange: Dispatch<SetStateAction<Record<string, string>>>;
};

export type DatasetGridEditorProps = Omit<DatasetGridProps, 'wrapRef'>;
