import { FileSpreadsheet } from 'lucide-react';
import { lazy } from 'react';

import { ClientOnlyDeffered, EmptyState } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import type { DatasetGridEditorProps, DatasetGridProps } from './types';

import styles from './DatasetGrid.module.scss';

const LazyDatasetGridEditor = lazy(() =>
    import('./components/DatasetGridEditor').then(module => ({
        default: module.DatasetGridEditor,
    }))
);

export const DatasetGrid = ({
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
}: DatasetGridProps) => {
    const isEmpty = rows.length === 0 && !insertDraft;

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
                        }}
                    />
                )
            )}
        </div>
    );
};
