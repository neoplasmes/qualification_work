import type { GridSelection } from '@glideapps/glide-data-grid';

import type { DatasetColumn, DatasetRow } from '@/entities/dataset';

export type DatasetGridProps = {
    datasetId: string;
    columns: DatasetColumn[];
    totalRows: number;
    getRowAt: (absIndex: number) => DatasetRow | undefined;
    displayEdits: Map<string, Record<string, unknown>>;
    invalidCellKeys: Set<string>;
    gridWidth: number;
    gridHeight: number;
    scrollToBottomSignal: number;
    gridSelection: GridSelection;
    onGridSelectionChange: (selection: GridSelection) => void;
    onCellCommit: (rowId: string, column: DatasetColumn, rawValue: string) => void;
    onRowContextMenu: (rowIndex: number, position: { x: number; y: number }) => void;
    onColumnContextMenu: (
        column: DatasetColumn,
        position: { x: number; y: number }
    ) => void;
    onVisibleRangeChange: (startRow: number, endRow: number) => void;
};

export type DatasetGridEditorProps = DatasetGridProps;
