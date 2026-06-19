import type { SubmitEventHandler } from 'react';

import type { DatasetMetadata } from '@/entities/dataset';

import { actionBuilderTestIds } from './const';
import { actionBuilderConfig, type ActionBuilderDraft } from './model';
import { ActionGeneralSection, EffectsSection, ParametersSection } from './ui';

import styles from './ActionBuilder.module.scss';

export type ActionBuilderProps = {
    value: ActionBuilderDraft;
    datasets: DatasetMetadata[];
    disabled: boolean;
    formId: string;
    onChange: (draft: ActionBuilderDraft) => void;
    onSubmit: SubmitEventHandler<HTMLFormElement>;
};

export const ActionBuilder = ({
    value,
    datasets,
    disabled,
    formId,
    onChange,
    onSubmit,
}: ActionBuilderProps) => (
    <actionBuilderConfig.Root
        id={formId}
        className={styles['root']}
        data-display="grid"
        data-gap="sm"
        data-test-id={actionBuilderTestIds.configureForm}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
    >
        <ActionGeneralSection disabled={disabled} />
        <div className={styles['layout']} data-display="grid" data-gap="sm">
            <ParametersSection disabled={disabled} />
            <EffectsSection datasets={datasets} disabled={disabled} />
        </div>
    </actionBuilderConfig.Root>
);
