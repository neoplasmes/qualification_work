import DataEditor, {
    GridCellKind,
    type EditableGridCell,
    type GridCell,
    type GridColumn,
    type Item,
} from '@glideapps/glide-data-grid';

import '@glideapps/glide-data-grid/dist/index.css';

import { FileSpreadsheet } from 'lucide-react';
import {
    useCallback,
    useMemo,
    type Dispatch,
    type RefObject,
    type SetStateAction,
} from 'react';

import { formatChartCell } from '@/entities/chart';
import type { DatasetColumn, DatasetRow } from '@/entities/dataset';

import { datasetsTestIds, GRID_THEME, HEADER_H, ROW_H } from '../../../const';
import { isValidDatasetCellValue } from '../../../lib';

import styles from './DatasetGrid.module.scss';

type DatasetGridProps = {
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

export const DatasetGrid = ({
    columns,
    rows,
    displayEdits,
    isInsertingRow,
    newRowValues,
    gridWidth,
    gridHeight,
    wrapRef,
    onCellCommit,
    onNewRowValueChange,
}: DatasetGridProps) => {
    const rowCount = rows.length + (isInsertingRow ? 1 : 0);
    const gridColumns = useMemo<GridColumn[]>(
        () =>
            columns.map(column => ({
                id: column.key,
                title: column.displayName.toUpperCase(),
                width: 150,
                grow: 1,
            })),
        [columns]
    );

    const getCellContent = useCallback(
        ([columnIndex, rowIndex]: Item): GridCell => {
            const column = columns[columnIndex];
            if (!column) {
                return getEmptyCell();
            }

            if (isInsertingRow && rowIndex === rows.length) {
                const value = newRowValues[column.key] ?? '';

                return {
                    kind: GridCellKind.Text,
                    data: value,
                    displayData: value,
                    allowOverlay: true,
                };
            }

            const dataRow = rows[rowIndex];
            if (!dataRow) {
                return getEmptyCell();
            }

            const rawValue =
                displayEdits.get(dataRow.id)?.[column.key] ?? dataRow.data[column.key];
            const display = formatChartCell(rawValue);

            return {
                kind: GridCellKind.Text,
                data: display,
                displayData: display,
                allowOverlay: true,
            };
        },
        [columns, displayEdits, isInsertingRow, newRowValues, rows]
    );

    const onCellEdited = useCallback(
        ([columnIndex, rowIndex]: Item, newValue: EditableGridCell) => {
            const column = columns[columnIndex];
            if (!column || newValue.kind !== GridCellKind.Text) {
                return;
            }

            if (isInsertingRow && rowIndex === rows.length) {
                onNewRowValueChange(prev => ({ ...prev, [column.key]: newValue.data }));

                return;
            }

            const dataRow = rows[rowIndex];
            if (dataRow) {
                onCellCommit(dataRow.id, column, newValue.data);
            }
        },
        [columns, isInsertingRow, onCellCommit, onNewRowValueChange, rows]
    );

    const validateCell = useCallback(
        ([columnIndex]: Item, newValue: EditableGridCell): boolean => {
            const column = columns[columnIndex];
            if (!column || newValue.kind !== GridCellKind.Text) {
                return true;
            }

            return (
                newValue.data === '' ||
                isValidDatasetCellValue(newValue.data, column.dataType)
            );
        },
        [columns]
    );

    return (
        <div
            ref={wrapRef}
            className={styles['table-wrap']}
            data-test-id={datasetsTestIds.previewGrid}
            data-testid="dataset-preview-grid"
        >
            {rows.length === 0 && !isInsertingRow ? (
                <div className={styles['empty']}>
                    <FileSpreadsheet size={22} />
                    Dataset has no preview rows.
                </div>
            ) : (
                gridWidth > 0 && (
                    <DataEditor
                        theme={GRID_THEME}
                        columns={gridColumns}
                        rows={rowCount}
                        getCellContent={getCellContent}
                        onCellEdited={onCellEdited}
                        validateCell={validateCell}
                        rowMarkers="number"
                        headerHeight={HEADER_H}
                        rowHeight={ROW_H}
                        width={gridWidth}
                        height={gridHeight}
                        cellActivationBehavior="double-click"
                    />
                )
            )}
        </div>
    );
};

const getEmptyCell = (): GridCell => ({
    kind: GridCellKind.Text,
    data: '',
    displayData: '',
    allowOverlay: false,
});
