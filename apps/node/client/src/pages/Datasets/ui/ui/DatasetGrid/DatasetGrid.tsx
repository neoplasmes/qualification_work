import { FileSpreadsheet } from 'lucide-react';
import { lazy } from 'react';

import { ClientOnlyDeffered, EmptyState } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import type { DatasetGridEditorProps, DatasetGridProps } from './types';

import styles from './DatasetGrid.module.scss';

const LazyDatasetGridEditor = lazy(() =>
    import('./ui/DatasetGridEditor').then(module => ({
        default: module.DatasetGridEditor,
    }))
);

export const DatasetGrid = ({
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
}: DatasetGridProps) => {
    const isEmpty = totalRows === 0 && !insertDraft;

    return (
        <div
            className={styles['table-wrap']}
            data-test-id={datasetsTestIds.previewGrid}
            data-testid="dataset-preview-grid"
        >
            {isEmpty ? (
                <EmptyState icon={<FileSpreadsheet size={22} />}>
                    Dataset has no preview rows.
                </EmptyState>
            ) : (
                gridWidth > 0 && (
                    <ClientOnlyDeffered<DatasetGridEditorProps>
                        fallback={
                            <div
                                className={styles['loading']}
                                style={{ minHeight: gridHeight }}
                            >
                                Loading table...
                            </div>
                        }
                        LazyComponent={LazyDatasetGridEditor}
                        componentProps={{
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
                        }}
                    />
                )
            )}
        </div>
    );
};
