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

import { useDatasetTableOptions } from '@/features/manageDatasetTableOptions';

import { GRID_THEME, HEADER_H, ROW_H } from '../../../../../const';
import { formatDatasetCellValue, isValidDatasetCellValue } from '../../../../../lib';

import type { DatasetGridEditorProps } from '../../types';

const DEFAULT_COL_WIDTH = 150;
const DRAFT_ROW_OVERSCROLL_Y = 128;
// trailing empty space after the last column so its resize handle is reachable
const GRID_OVERSCROLL_X = 160;

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
    onColumnContextMenu,
    onDraftRowBoundsChange,
    onVisibleRangeChange,
}: DatasetGridEditorProps) => {
    const gridRef = useRef<DataEditorRef>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<HTMLElement | null>(null);
    const { widths, setColumnWidth, isHydrated } = useDatasetTableOptions(datasetId);
    const draftIndex = insertDraft?.visualIndex ?? null;
    const rowCount = totalRows + (insertDraft ? 1 : 0);

    // read row position straight from the DOM scroller, bypasses glide's
    // React-state lag where visibleRegion lags one render behind scrollTop
    const measureDraftBounds = useCallback(() => {
        if (draftIndex === null) {
            onDraftRowBoundsChange(null);

            return;
        }

        const scroller = scrollerRef.current;
        if (!scroller) {
            return;
        }

        const rect = scroller.getBoundingClientRect();
        const y = rect.top + HEADER_H + draftIndex * ROW_H - scroller.scrollTop;
        onDraftRowBoundsChange({ y, height: ROW_H });
    }, [draftIndex, onDraftRowBoundsChange]);

    // locate the inner scroller once it appears
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) {
            return;
        }

        const found = wrapper.querySelector<HTMLElement>('.dvn-scroller');
        if (found) {
            scrollerRef.current = found;

            return;
        }

        const mo = new MutationObserver(() => {
            const el = wrapper.querySelector<HTMLElement>('.dvn-scroller');
            if (el) {
                scrollerRef.current = el;
                mo.disconnect();
                measureDraftBounds();
            }
        });
        mo.observe(wrapper, { childList: true, subtree: true });

        return () => mo.disconnect();
    }, [measureDraftBounds]);

    // re-measure on draft change, resize, or scroll
    useEffect(() => {
        measureDraftBounds();
    }, [measureDraftBounds, gridWidth, gridHeight]);

    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller || draftIndex === null) {
            return;
        }

        const onScroll = () => measureDraftBounds();
        scroller.addEventListener('scroll', onScroll, { passive: true });

        return () => scroller.removeEventListener('scroll', onScroll);
    }, [draftIndex, measureDraftBounds]);

    useEffect(() => {
        if (draftIndex === null) {
            return;
        }

        gridRef.current?.scrollTo(0, draftIndex, 'vertical', 0, DRAFT_ROW_OVERSCROLL_Y, {
            vAlign: 'end',
        });

        measureDraftBounds();
    }, [draftIndex, measureDraftBounds]);

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
            const display = formatDatasetCellValue(rawValue, column.dataType);

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
        <div ref={wrapperRef} style={{ width: gridWidth, height: gridHeight }}>
            {isHydrated && (
                <DataEditor
                    ref={gridRef}
                    theme={GRID_THEME}
                    columns={gridColumns}
                    rows={rowCount}
                    getCellContent={getCellContent}
                    onCellEdited={onCellEdited}
                    validateCell={validateCell}
                    onCellContextMenu={handleCellContextMenu}
                    onHeaderContextMenu={handleHeaderContextMenu}
                    onColumnResize={handleColumnResize}
                    onVisibleRegionChanged={onVisibleRegionChanged}
                    rowMarkers="number"
                    headerHeight={HEADER_H}
                    rowHeight={ROW_H}
                    width={gridWidth}
                    height={gridHeight}
                    cellActivationBehavior="double-click"
                    overscrollX={GRID_OVERSCROLL_X}
                    overscrollY={insertDraft ? DRAFT_ROW_OVERSCROLL_Y : undefined}
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
