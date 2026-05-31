import { useDatasetChartBuilder, type DatasetChartBuilderProps } from '../model';
import { DatasetChartBuilderConfigForm, DatasetChartBuilderPreview } from './ui';

import styles from './DatasetChartBuilder.module.scss';

export const DatasetChartBuilder = (props: DatasetChartBuilderProps) => {
    const model = useDatasetChartBuilder(props);
    let content;

    if (model.step === 'preview' && model.previewData) {
        content = <DatasetChartBuilderPreview model={model} />;
    } else {
        content = <DatasetChartBuilderConfigForm model={model} />;
    }

    return (
        <section
            ref={model.builderRef}
            className={styles['builder']}
            data-stack="v"
            data-gap="md"
            data-flex
            aria-label="Chart builder"
        >
            {content}
        </section>
    );
};
