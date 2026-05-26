import { FileSpreadsheet } from 'lucide-react';
import { lazy } from 'react';

import { ClientOnlyDeffered } from '@/shared/ui/ClientOnlyDeffered';

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
    isInsertingRow,
    newRowValues,
    gridWidth,
    gridHeight,
    wrapRef,
    onCellCommit,
    onNewRowValueChange,
}: DatasetGridProps) => {
    const isEmpty = rows.length === 0 && !isInsertingRow;

    return (
        <div
            ref={wrapRef}
            className={styles['table-wrap']}
            data-test-id={datasetsTestIds.previewGrid}
            data-testid="dataset-preview-grid"
        >
            {isEmpty ? (
                <div className={styles['empty']}>
                    <FileSpreadsheet size={22} />
                    Dataset has no preview rows.
                </div>
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
                            isInsertingRow,
                            newRowValues,
                            gridWidth,
                            gridHeight,
                            onCellCommit,
                            onNewRowValueChange,
                        }}
                    />
                )
            )}
        </div>
    );
};
