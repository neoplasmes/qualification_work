import DataEditor, {
    GridCellKind,
    type DataEditorRef,
    type EditableGridCell,
    type GridCell,
    type GridColumn,
    type Item,
    type Rectangle,
} from '@glideapps/glide-data-grid';

import '@glideapps/glide-data-grid/dist/index.css';

import { useCallback, useEffect, useMemo, useRef, type ComponentProps } from 'react';

import { formatChartCell } from '@/entities/chart';

import { GRID_THEME, HEADER_H, ROW_H } from '../../../../../const';
import { isValidDatasetCellValue } from '../../../../../lib';

import type { DatasetGridEditorProps } from '../../types';
import { useColumnWidths } from './useColumnWidths';

const DEFAULT_COL_WIDTH = 150;
const DRAFT_ROW_OVERSCROLL_Y = 128;

export const DatasetGridEditor = ({
    datasetId,
    columns,
    totalRows,
    getRowAt,
    displayEdits,
    insertDraft,
    gridWidth,
    gridHeight,
    scrollToBottomSignal,
    onCellCommit,
    onDraftValueChange,
    onRowContextMenu,
    onDraftRowBoundsChange,
    onVisibleRangeChange,
}: DatasetGridEditorProps) => {
    const gridRef = useRef<DataEditorRef>(null);
    const { widths, setColumnWidth } = useColumnWidths(datasetId);
    const draftIndex = insertDraft?.visualIndex ?? null;
    const rowCount = totalRows + (insertDraft ? 1 : 0);

    const reportDraftBounds = useCallback(() => {
        if (draftIndex === null) {
            onDraftRowBoundsChange(null);

            return;
        }

        // any column gives same y/height for the row
        const bounds = gridRef.current?.getBounds(0, draftIndex);
        if (!bounds) {
            onDraftRowBoundsChange(null);

            return;
        }

        onDraftRowBoundsChange({ y: bounds.y, height: bounds.height });
    }, [draftIndex, onDraftRowBoundsChange]);

    // recompute when draft index changes or grid resizes
    useEffect(() => {
        reportDraftBounds();
    }, [reportDraftBounds, gridWidth, gridHeight]);

    useEffect(() => {
        if (draftIndex === null) {
            return;
        }

        gridRef.current?.scrollTo(0, draftIndex, 'vertical', 0, DRAFT_ROW_OVERSCROLL_Y, {
            vAlign: 'end',
        });

        const frame = window.requestAnimationFrame(reportDraftBounds);

        return () => window.cancelAnimationFrame(frame);
    }, [draftIndex, reportDraftBounds]);

    // jump to last row when parent bumps the signal
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
                    width: stored ?? DEFAULT_COL_WIDTH,
                    // grow only when user hasn't customized the width
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

            if (draftIndex !== null && rowIndex === draftIndex) {
                const value = insertDraft?.values[column.key] ?? '';

                return {
                    kind: GridCellKind.Text,
                    data: value,
                    displayData: value,
                    allowOverlay: true,
                };
            }

            const dataRow = getRowAt(toSourceRowIndex(rowIndex, draftIndex));
            if (!dataRow) {
                return getLoadingCell();
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
        [columns, displayEdits, draftIndex, insertDraft?.values, getRowAt]
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

            const dataRow = getRowAt(toSourceRowIndex(rowIndex, draftIndex));
            if (dataRow) {
                onCellCommit(dataRow.id, column, newValue.data);
            }
        },
        [columns, draftIndex, onCellCommit, onDraftValueChange, getRowAt]
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
            if (!getRowAt(sourceRowIndex)) {
                return;
            }

            onRowContextMenu(sourceRowIndex, {
                x: event.bounds.x,
                y: event.bounds.y + event.bounds.height,
            });
        },
        [draftIndex, onRowContextMenu, getRowAt]
    );

    const onVisibleRegionChanged = useCallback(
        (range: Rectangle) => {
            const startRow = range.y;
            const endRow = Math.max(range.y, range.y + range.height - 1);
            onVisibleRangeChange(startRow, endRow);

            reportDraftBounds();
        },
        [onVisibleRangeChange, reportDraftBounds]
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
            ref={gridRef}
            theme={GRID_THEME}
            columns={gridColumns}
            rows={rowCount}
            getCellContent={getCellContent}
            onCellEdited={onCellEdited}
            validateCell={validateCell}
            onCellContextMenu={handleCellContextMenu}
            onColumnResize={handleColumnResize}
            onVisibleRegionChanged={onVisibleRegionChanged}
            rowMarkers="number"
            headerHeight={HEADER_H}
            rowHeight={ROW_H}
            width={gridWidth}
            height={gridHeight}
            cellActivationBehavior="double-click"
            overscrollY={insertDraft ? DRAFT_ROW_OVERSCROLL_Y : undefined}
            smoothScrollX
            smoothScrollY
        />
    );
};

const getEmptyCell = (): GridCell => ({
    kind: GridCellKind.Text,
    data: '',
    displayData: '',
    allowOverlay: false,
});

// skeleton cell shown while the chunk is still loading
const getLoadingCell = (): GridCell => ({
    kind: GridCellKind.Loading,
    allowOverlay: false,
    skeletonWidth: 80,
    skeletonHeight: 12,
    skeletonWidthVariability: 30,
});

const toSourceRowIndex = (rowIndex: number, draftIndex: number | null) =>
    draftIndex !== null && rowIndex > draftIndex ? rowIndex - 1 : rowIndex;
