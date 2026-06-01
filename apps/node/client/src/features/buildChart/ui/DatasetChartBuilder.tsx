import { useId } from 'react';
import { createPortal } from 'react-dom';

import { Separator } from '@/shared/ui';

import { useDatasetChartBuilder, type DatasetChartBuilderProps } from '../model';
import {
    BuilderActions,
    DatasetChartBuilderConfigForm,
    DatasetChartBuilderPreview,
    PreviewActions,
} from './ui';

import styles from './DatasetChartBuilder.module.scss';

export const DatasetChartBuilder = (props: DatasetChartBuilderProps) => {
    const model = useDatasetChartBuilder(props);
    const formId = useId();
    const isPreview = model.step === 'preview' && Boolean(model.previewData);

    let content;
    let actions;

    if (isPreview) {
        content = <DatasetChartBuilderPreview model={model} />;
        actions = <PreviewActions model={model} />;
    } else {
        content = <DatasetChartBuilderConfigForm model={model} formId={formId} />;
        actions = (
            <BuilderActions
                canPreview={model.derived.canPreview}
                editMode={model.editMode}
                isSaving={model.isSaving}
                formId={formId}
                onSaveWithoutPreview={model.onSaveWithoutPreview}
                previewLoading={model.previewLoading}
            />
        );
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
            {props.actionsContainer ? (
                createPortal(actions, props.actionsContainer)
            ) : (
                <>
                    <Separator />
                    {actions}
                </>
            )}
        </section>
    );
};
