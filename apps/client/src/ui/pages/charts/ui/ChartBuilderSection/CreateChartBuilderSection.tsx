import { Button } from '@qualification-work/design-system';
import { Database, X } from 'lucide-react';
import { useState } from 'react';

import {
    ChartBuilder,
    type ChartBuilderDraft,
    type ChartBuilderOutput,
} from '@/widgets/ChartBuilder';

import type { DatasetMetadata } from '@/entities/dataset';

import { chartsTestIds } from '../../const';

import styles from './ChartBuilderSection.module.css';

type CreateChartBuilderSectionProps = {
    orgId: string;
    dataset: DatasetMetadata;
    draft: ChartBuilderDraft;
    onChangeDataset: () => void;
    onCancel: () => void;
    onDraftChange: (draft: ChartBuilderDraft) => void;
    onOutputChange: (output: ChartBuilderOutput) => void;
    onChartCreated: (chartId: string) => void;
};

export const CreateChartBuilderSection = ({
    orgId,
    dataset,
    draft,
    onChangeDataset,
    onCancel,
    onDraftChange,
    onOutputChange,
    onChartCreated,
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
                orgId={orgId}
                selectedDataset={dataset}
                value={draft}
                actionsContainer={actionsEl}
                onChange={onDraftChange}
                onOutputChange={onOutputChange}
                onChartCreated={onChartCreated}
            />
        </>
    );
};
