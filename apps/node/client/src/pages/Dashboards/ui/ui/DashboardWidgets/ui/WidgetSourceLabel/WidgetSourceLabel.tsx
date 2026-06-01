import styles from './WidgetSourceLabel.module.scss';

type WidgetSourceLabelProps = {
    sourceName?: string;
};

export const WidgetSourceLabel = ({ sourceName }: WidgetSourceLabelProps) => {
    if (!sourceName) {
        return null;
    }

    return (
        <div className={styles['source-line']}>
            <span className={styles['source-name']} title={sourceName}>
                {sourceName}
            </span>
        </div>
    );
};
