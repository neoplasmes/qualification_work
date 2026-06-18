import DataEditor, {
    GridCellKind,
    type DataEditorRef,
    type EditableGridCell,
    type GridCell,
    type GridColumn,
    type Item,
    type Rectangle,
    type Theme,
} from '@glideapps/glide-data-grid';

import '@glideapps/glide-data-grid/dist/index.css';

import { useCallback, useEffect, useMemo, useRef, type ComponentProps } from 'react';

import { useDatasetTableOptions } from '@/features/manageDatasetTableOptions';

import { gridTheme, headerHeight, rowHeight } from '../../../../const';
import { datasetCellValueHandlers } from '../../../DatasetWorkspace/lib';

import type { DatasetGridEditorProps } from '../../types';

const defaultColWidth = 150;
const gridOverscrollX = 160;
const invalidCellTheme: Partial<Theme> = {
    bgCell: 'rgba(145,14,47,0.2)',
    textDark: '#ffd6df',
    borderColor: '#910e2f',
    horizontalBorderColor: '#910e2f',
};

export const DatasetGridEditor = ({
    datasetId,
    columns,
    totalRows,
    getRowAt,
    displayEdits,
    invalidCellKeys,
    gridWidth,
    gridHeight,
    scrollToBottomSignal,
    gridSelection,
    onGridSelectionChange,
    onCellCommit,
    onRowContextMenu,
    onColumnContextMenu,
    onVisibleRangeChange,
}: DatasetGridEditorProps) => {
    const gridRef = useRef<DataEditorRef>(null);
    const { widths, setColumnWidth, isHydrated } = useDatasetTableOptions(datasetId);
    const rowCount = totalRows;

    useEffect(() => {
        if (scrollToBottomSignal <= 0 || totalRows <= 0) {
            return;
        }

        gridRef.current?.scrollTo(0, totalRows - 1, 'vertical', 0, 0, {
            vAlign: 'end',
        });
    }, [scrollToBottomSignal, totalRows]);

    const gridColumns = useMemo<GridColumn[]>(
        () =>
            columns.map(column => {
                const stored = widths[column.key];

                return {
                    id: column.key,
                    title: column.displayName.toUpperCase(),
                    width: stored ?? defaultColWidth,
                    grow: stored === undefined ? 1 : 0,
                };
            }),
        [columns, widths]
    );

    const handleColumnResize = useCallback(
        (column: GridColumn, newSize: number) => {
            if (!column.id) {
                return;
            }

            setColumnWidth(column.id, newSize);
        },
        [setColumnWidth]
    );

    const getCellContent = useCallback(
        ([columnIndex, rowIndex]: Item): GridCell => {
            const column = columns[columnIndex];
            if (!column) {
                return getEmptyCell();
            }

            const dataRow = getRowAt(rowIndex);
            if (!dataRow) {
                return getLoadingCell();
            }

            const rawValue =
                displayEdits.get(dataRow.id)?.[column.key] ?? dataRow.data[column.key];
            const display = datasetCellValueHandlers[column.dataType].format(rawValue);

            return {
                kind: GridCellKind.Text,
                data: display,
                displayData: display,
                allowOverlay: true,
                themeOverride: invalidCellKeys.has(`${dataRow.id}:${column.key}`)
                    ? invalidCellTheme
                    : undefined,
            };
        },
        [columns, displayEdits, getRowAt, invalidCellKeys]
    );

    const onCellEdited = useCallback(
        ([columnIndex, rowIndex]: Item, newValue: EditableGridCell) => {
            const column = columns[columnIndex];
            if (!column || newValue.kind !== GridCellKind.Text) {
                return;
            }

            const dataRow = getRowAt(rowIndex);
            if (dataRow) {
                onCellCommit(dataRow.id, column, newValue.data);
            }
        },
        [columns, onCellCommit, getRowAt]
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
            if (!getRowAt(rowIndex)) {
                return;
            }

            onRowContextMenu(rowIndex, {
                x: event.bounds.x,
                y: event.bounds.y + event.bounds.height,
            });
        },
        [onRowContextMenu, getRowAt]
    );

    const handleHeaderContextMenu = useCallback(
        (
            columnIndex: number,
            event: Parameters<
                NonNullable<ComponentProps<typeof DataEditor>['onHeaderContextMenu']>
            >[1]
        ) => {
            event.preventDefault();

            const column = columns[columnIndex];
            if (!column) {
                return;
            }

            onColumnContextMenu(column, {
                x: event.bounds.x,
                y: event.bounds.y + event.bounds.height,
            });
        },
        [columns, onColumnContextMenu]
    );

    const onVisibleRegionChanged = useCallback(
        (range: Rectangle) => {
            const startRow = range.y;
            const endRow = Math.max(range.y, range.y + range.height - 1);
            onVisibleRangeChange(startRow, endRow);
        },
        [onVisibleRangeChange]
    );

    return (
        <div style={{ width: gridWidth, height: gridHeight }}>
            {isHydrated && (
                <DataEditor
                    ref={gridRef}
                    theme={gridTheme}
                    columns={gridColumns}
                    rows={rowCount}
                    getCellContent={getCellContent}
                    onCellEdited={onCellEdited}
                    onCellContextMenu={handleCellContextMenu}
                    onHeaderContextMenu={handleHeaderContextMenu}
                    onColumnResize={handleColumnResize}
                    onVisibleRegionChanged={onVisibleRegionChanged}
                    gridSelection={gridSelection}
                    onGridSelectionChange={onGridSelectionChange}
                    rangeSelect="multi-rect"
                    rowMarkers="number"
                    headerHeight={headerHeight}
                    rowHeight={rowHeight}
                    width={gridWidth}
                    height={gridHeight}
                    cellActivationBehavior="double-click"
                    overscrollX={gridOverscrollX}
                    smoothScrollX
                    smoothScrollY
                />
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

const getLoadingCell = (): GridCell => ({
    kind: GridCellKind.Loading,
    allowOverlay: false,
    skeletonWidth: 80,
    skeletonHeight: 12,
    skeletonWidthVariability: 30,
});
