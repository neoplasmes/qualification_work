import {
    ChartBuilder,
    type ChartBuilderDraft,
    type ChartBuilderOutput,
    type ChartBuilderProps,
} from '@/ui/pages/charts/ui/ChartBuilder';
import { Button } from '@qualification-work/design-system';
import { Database, X } from 'lucide-react';
import { useState } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { chartsTestIds } from '../../const';

import styles from './ChartBuilderSection.module.css';

type CreateChartBuilderSectionProps = {
    builderActions: Pick<
        ChartBuilderProps,
        | 'preview'
        | 'previewLoading'
        | 'chartError'
        | 'isSaving'
        | 'onPreview'
        | 'onSave'
        | 'onBackToConfig'
    >;
    dataset: DatasetMetadata;
    draft: ChartBuilderDraft;
    onChangeDataset: () => void;
    onCancel: () => void;
    onDraftChange: (draft: ChartBuilderDraft) => void;
    onOutputChange: (output: ChartBuilderOutput) => void;
};

export const CreateChartBuilderSection = ({
    builderActions,
    dataset,
    draft,
    onChangeDataset,
    onCancel,
    onDraftChange,
    onOutputChange,
}: CreateChartBuilderSectionProps) => {
    const [actionsEl, setActionsEl] = useState<HTMLDivElement | null>(null);

    return (
        <>
            <div className={styles['builder-header']}>
                <div data-stack="v" data-gap="xs">
                    <span className={styles['eyebrow']}>New chart</span>
                    <h2 className={styles['title']}>{dataset.dataset.name}</h2>
                </div>
                <div data-stack="h" data-gap="sm" data-align="center">
                    <Button
                        data-test-id={chartsTestIds.changeDatasetButton}
                        disabled={builderActions.isSaving}
                        onClick={onChangeDataset}
                    >
                        <Database size={18} aria-hidden />
                        Change dataset
                    </Button>
                    <Button
                        data-test-id={chartsTestIds.cancelCreateButton}
                        onClick={onCancel}
                    >
                        <X size={18} aria-hidden />
                        Cancel
                    </Button>
                    <div
                        ref={setActionsEl}
                        data-stack="h"
                        data-gap="sm"
                        data-align="center"
                    />
                </div>
            </div>
            <ChartBuilder
                key={dataset.dataset.id}
                {...builderActions}
                selectedDataset={dataset}
                value={draft}
                actionsContainer={actionsEl}
                onChange={onDraftChange}
                onOutputChange={onOutputChange}
            />
        </>
    );
};
