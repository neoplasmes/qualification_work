import DataEditor, {
    GridCellKind,
    type EditableGridCell,
    type GridCell,
    type GridColumn,
    type Item,
    type Rectangle,
} from '@glideapps/glide-data-grid';

import '@glideapps/glide-data-grid/dist/index.css';

import { useCallback, useMemo, type ComponentProps } from 'react';

import { formatChartCell } from '@/entities/chart';

import { GRID_THEME, HEADER_H, ROW_H } from '../../../../../const';
import { isValidDatasetCellValue } from '../../../../../lib';

import type { DatasetGridEditorProps } from '../../types';

export const DatasetGridEditor = ({
    columns,
    rows,
    displayEdits,
    insertDraft,
    gridWidth,
    gridHeight,
    hasMore,
    onCellCommit,
    onDraftValueChange,
    onRowContextMenu,
    onLoadMore,
}: DatasetGridEditorProps) => {
    const draftIndex = insertDraft?.visualIndex ?? null;
    const rowCount = rows.length + (insertDraft ? 1 : 0);
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

            if (draftIndex !== null && rowIndex === draftIndex) {
                const value = insertDraft?.values[column.key] ?? '';

                return {
                    kind: GridCellKind.Text,
                    data: value,
                    displayData: value,
                    allowOverlay: true,
                };
            }

            const dataRow = rows[toSourceRowIndex(rowIndex, draftIndex)];
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
        [columns, displayEdits, draftIndex, insertDraft?.values, rows]
    );

    const onCellEdited = useCallback(
        ([columnIndex, rowIndex]: Item, newValue: EditableGridCell) => {
            const column = columns[columnIndex];
            if (!column || newValue.kind !== GridCellKind.Text) {
                return;
            }

            if (draftIndex !== null && rowIndex === draftIndex) {
                onDraftValueChange(prev => ({ ...prev, [column.key]: newValue.data }));

                return;
            }

            const dataRow = rows[toSourceRowIndex(rowIndex, draftIndex)];
            if (dataRow) {
                onCellCommit(dataRow.id, column, newValue.data);
            }
        },
        [columns, draftIndex, onCellCommit, onDraftValueChange, rows]
    );

    const handleCellContextMenu = useCallback(
        (
            _cell: Item,
            event: Parameters<
                NonNullable<ComponentProps<typeof DataEditor>['onCellContextMenu']>
            >[1]
        ) => {
            event.preventDefault();

            const rowIndex = event.location[1];
            if (draftIndex !== null && rowIndex === draftIndex) {
                return;
            }

            const sourceRowIndex = toSourceRowIndex(rowIndex, draftIndex);
            if (!rows[sourceRowIndex]) {
                return;
            }

            onRowContextMenu(sourceRowIndex, {
                x: event.bounds.x,
                y: event.bounds.y + event.bounds.height,
            });
        },
        [draftIndex, onRowContextMenu, rows]
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
            onCellContextMenu={handleCellContextMenu}
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

const toSourceRowIndex = (rowIndex: number, draftIndex: number | null) =>
    draftIndex !== null && rowIndex > draftIndex ? rowIndex - 1 : rowIndex;
