import { skipToken } from '@reduxjs/toolkit/query';
import { ChevronLeft, ChevronRight, FileSpreadsheet, Table2 } from 'lucide-react';
import { useState } from 'react';

import { useGetDatasetRowsQuery, type DatasetMetadata } from '@/features/datasets';

import { formatChartCell } from '@/entities/chart';

import { IconButton } from '@/shared/ui';

import styles from './DatasetsPage.module.scss';

const ROWS_PAGE_SIZE = 50;

type DatasetPreviewProps = {
    selectedDataset: DatasetMetadata | undefined;
};

export const DatasetPreview = ({ selectedDataset }: DatasetPreviewProps) => {
    const [rowsOffset, setRowsOffset] = useState(0);

    const rowsQuery = useGetDatasetRowsQuery(
        selectedDataset
            ? {
                  datasetId: selectedDataset.dataset.id,
                  offset: rowsOffset,
                  limit: ROWS_PAGE_SIZE,
              }
            : skipToken
    );

    const columns = selectedDataset?.columns ?? [];
    const totalRows = rowsQuery.data?.totalRows ?? selectedDataset?.totalRows ?? 0;
    const hasPreviousRows = rowsOffset > 0;
    const hasNextRows = rowsOffset + ROWS_PAGE_SIZE < totalRows;

    return (
        <section className={styles['preview']} aria-label="Dataset preview">
            <div className={styles['preview-header']}>
                <div data-stack="h" data-gap="sm" data-align="center">
                    <Table2 size={20} />
                    <span className={styles['eyebrow']}>Preview</span>
                </div>

                {selectedDataset && (
                    <div data-stack="h" data-gap="sm" data-align="center">
                        <IconButton
                            aria-label="Previous rows"
                            disabled={!hasPreviousRows || rowsQuery.isFetching}
                            onClick={() =>
                                setRowsOffset(offset =>
                                    Math.max(0, offset - ROWS_PAGE_SIZE)
                                )
                            }
                        >
                            <ChevronLeft size={18} />
                        </IconButton>
                        <span className={styles['page-indicator']}>
                            {totalRows === 0
                                ? '0 rows'
                                : `${rowsOffset + 1}-${Math.min(
                                      rowsOffset + ROWS_PAGE_SIZE,
                                      totalRows
                                  )} of ${totalRows}`}
                        </span>
                        <IconButton
                            aria-label="Next rows"
                            disabled={!hasNextRows || rowsQuery.isFetching}
                            onClick={() =>
                                setRowsOffset(offset => offset + ROWS_PAGE_SIZE)
                            }
                        >
                            <ChevronRight size={18} />
                        </IconButton>
                    </div>
                )}
            </div>

            {!selectedDataset && (
                <p className={styles['panel-placeholder']}>Select a dataset to preview rows.</p>
            )}

            {selectedDataset && rowsQuery.isLoading && (
                <div className={styles['status']}>Loading rows...</div>
            )}

            {selectedDataset && rowsQuery.data && (
                <div className={styles['table-wrap']}>
                    <table className={styles['table']}>
                        <thead>
                            <tr>
                                <th></th>
                                {columns.map(column => (
                                    <th key={column.id}>
                                        <div className={styles['th-inner']}>
                                            <span>{column.displayName}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rowsQuery.data.rows.map(row => (
                                <tr key={row.id}>
                                    <td>{row.rowIndex + 1}</td>
                                    {columns.map(column => (
                                        <td key={column.id}>
                                            <div className={styles['td-inner']}>
                                                {formatChartCell(row.data[column.key])}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedDataset && rowsQuery.data?.rows.length === 0 && (
                <div className={styles['empty']}>
                    <FileSpreadsheet size={22} />
                    Dataset has no preview rows.
                </div>
            )}
        </section>
    );
};
