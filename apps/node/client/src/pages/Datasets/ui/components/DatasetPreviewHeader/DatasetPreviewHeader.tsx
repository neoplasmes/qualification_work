import { ChevronLeft, ChevronRight, ChevronsRight, Table2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { IconButton, SectionHeader } from '@/shared/ui';

import { datasetsTestIds, ROWS_PAGE_SIZE } from '../../../const';

import styles from './DatasetPreviewHeader.module.scss';

type DatasetPreviewHeaderProps = {
    hasDataset: boolean;
    hasPreviousRows: boolean;
    hasNextRows: boolean;
    isFetching: boolean;
    isOnLastPage: boolean;
    lastPageOffset: number;
    rowsOffset: number;
    totalRows: number;
    onRowsOffsetChange: Dispatch<SetStateAction<number>>;
};

export const DatasetPreviewHeader = ({
    hasDataset,
    hasPreviousRows,
    hasNextRows,
    isFetching,
    isOnLastPage,
    lastPageOffset,
    rowsOffset,
    totalRows,
    onRowsOffsetChange,
}: DatasetPreviewHeaderProps) => (
    <div className={styles['preview-header']}>
        <SectionHeader
            eyebrow={
                <>
                    <Table2 size={20} /> Preview
                </>
            }
        />

        {hasDataset && (
            <div data-stack="h" data-gap="sm" data-align="center">
                <IconButton
                    data-test-id={datasetsTestIds.previousRowsButton}
                    aria-label="Previous rows"
                    disabled={!hasPreviousRows || isFetching}
                    onClick={() =>
                        onRowsOffsetChange(offset => Math.max(0, offset - ROWS_PAGE_SIZE))
                    }
                >
                    <ChevronLeft size={18} />
                </IconButton>
                <span className={styles['page-indicator']}>
                    {getPageText(rowsOffset, totalRows)}
                </span>
                <IconButton
                    data-test-id={datasetsTestIds.nextRowsButton}
                    aria-label="Next rows"
                    disabled={!hasNextRows || isFetching}
                    onClick={() => onRowsOffsetChange(offset => offset + ROWS_PAGE_SIZE)}
                >
                    <ChevronRight size={18} />
                </IconButton>
                <IconButton
                    data-test-id={datasetsTestIds.lastPageButton}
                    aria-label="Last page"
                    disabled={isOnLastPage || isFetching}
                    onClick={() => onRowsOffsetChange(lastPageOffset)}
                >
                    <ChevronsRight size={18} />
                </IconButton>
            </div>
        )}
    </div>
);

const getPageText = (rowsOffset: number, totalRows: number) => {
    if (totalRows === 0) {
        return '0 rows';
    }

    return `${rowsOffset + 1}-${Math.min(rowsOffset + ROWS_PAGE_SIZE, totalRows)} of ${totalRows}`;
};
