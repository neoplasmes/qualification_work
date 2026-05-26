import DataEditor, {
    GridCellKind,
    type EditableGridCell,
    type GridCell,
    type GridColumn,
    type Item,
    type Rectangle,
} from '@glideapps/glide-data-grid';

import '@glideapps/glide-data-grid/dist/index.css';

import { useCallback, useMemo } from 'react';

import { formatChartCell } from '@/entities/chart';

import { GRID_THEME, HEADER_H, ROW_H } from '../../../../../const';
import { isValidDatasetCellValue } from '../../../../../lib';

import type { DatasetGridEditorProps } from '../../types';

export const DatasetGridEditor = ({
    columns,
    rows,
    displayEdits,
    isInsertingRow,
    newRowValues,
    gridWidth,
    gridHeight,
    hasMore,
    onCellCommit,
    onNewRowValueChange,
    onLoadMore,
}: DatasetGridEditorProps) => {
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

    const onVisibleRegionChanged = useCallback(
        (range: Rectangle) => {
            if (hasMore && range.y + range.height >= rowCount - 8) {
                onLoadMore();
            }
        },
        [hasMore, rowCount, onLoadMore]
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
        <DataEditor
            theme={GRID_THEME}
            columns={gridColumns}
            rows={rowCount}
            getCellContent={getCellContent}
            onCellEdited={onCellEdited}
            validateCell={validateCell}
            onVisibleRegionChanged={onVisibleRegionChanged}
            rowMarkers="number"
            headerHeight={HEADER_H}
            rowHeight={ROW_H}
            width={gridWidth}
            height={gridHeight}
            cellActivationBehavior="double-click"
        />
    );
};

const getEmptyCell = (): GridCell => ({
    kind: GridCellKind.Text,
    data: '',
    displayData: '',
    allowOverlay: false,
});
