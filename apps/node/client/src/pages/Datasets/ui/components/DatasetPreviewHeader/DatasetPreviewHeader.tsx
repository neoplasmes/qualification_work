import styles from './DatasetPreviewHeader.module.scss';

type DatasetPreviewHeaderProps = {
    hasDataset: boolean;
    loadedCount: number;
    totalRows: number;
    isFetching: boolean;
};

export const DatasetPreviewHeader = ({
    hasDataset,
    loadedCount,
    totalRows,
    isFetching,
}: DatasetPreviewHeaderProps) => (
    <div className={styles['preview-header']}>
        {hasDataset && (
            <span className={styles['page-indicator']}>
                {isFetching
                    ? `Loading... (${loadedCount} of ${totalRows} rows)`
                    : `${loadedCount} of ${totalRows} rows`}
            </span>
        )}
    </div>
);
