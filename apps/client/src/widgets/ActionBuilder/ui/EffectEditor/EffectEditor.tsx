import { Button, Divider } from '@qualification-work/design-system';
import { Plus } from 'lucide-react';
import { Fragment, useMemo } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { actionBuilderTestIds } from '../../const';
import {
    actionBuilderConfig,
    createBlankValueMappingDraft,
    type ActionEffectDraft,
    type ActionParameterDraft,
} from '../../model';
import { EffectFields } from '../EffectFields';
import { EffectHeader } from '../EffectHeader';
import { MappingRow } from '../MappingRow';

import styles from './EffectEditor.module.scss';

type EffectEditorProps = {
    effect: ActionEffectDraft;
    index: number;
    parameters: ActionParameterDraft[];
    effectsCount: number;
    datasets: DatasetMetadata[];
    disabled: boolean;
    collapsed: boolean;
    onToggleCollapse: () => void;
};

export const EffectEditor = ({
    effect,
    index,
    parameters,
    effectsCount,
    datasets,
    disabled,
    collapsed,
    onToggleCollapse,
}: EffectEditorProps) => {
    const snapshot = actionBuilderConfig.useConfig();
    const columns = useMemo(
        () => datasets.find(item => item.dataset.id === effect.datasetId)?.columns ?? [],
        [datasets, effect.datasetId]
    );
    const summary = useMemo(() => {
        const datasetName = datasets.find(d => d.dataset.id === effect.datasetId)?.dataset
            .name;
        const valuesPart = `${effect.values.length} value${effect.values.length !== 1 ? 's' : ''}`;

        return datasetName ? `${datasetName} · ${valuesPart}` : valuesPart;
    }, [datasets, effect.datasetId, effect.values.length]);

    const handleAddValue = () => {
        snapshot.mutateDraft(draft => {
            const nextEffect = draft.effects.find(item => item.id === effect.id);

            nextEffect?.values.push(createBlankValueMappingDraft());
        });
    };

    return (
        <>
            <div
                className={styles['effect-section']}
                data-stack="v"
                data-gap="md"
                data-py="md"
                data-test-id={actionBuilderTestIds.effectCard}
                data-effect-id={effect.id}
            >
                <EffectHeader
                    index={index}
                    effectsCount={effectsCount}
                    effect={effect}
                    disabled={disabled}
                    collapsed={collapsed}
                    summary={summary}
                    onToggleCollapse={onToggleCollapse}
                />

                {!collapsed && (
                    <>
                        <div
                            className={styles['form-grid']}
                            data-stack="v"
                            data-gap="sm"
                            data-align="start"
                        >
                            <EffectFields
                                effect={effect}
                                parameters={parameters}
                                columns={columns}
                                datasets={datasets}
                                disabled={disabled}
                            />
                        </div>

                        <div data-stack="v" data-gap="sm">
                            <div
                                data-stack="h"
                                data-gap="sm"
                                data-align="center"
                                data-justify="between"
                            >
                                <span className={styles['eyebrow']}>Column values</span>
                                <Button
                                    className={styles['add-value-button']}
                                    variant="ghost"
                                    data-test-id={actionBuilderTestIds.addValueButton}
                                    disabled={disabled}
                                    onClick={handleAddValue}
                                >
                                    <Plus size={18} />
                                    Add value
                                </Button>
                            </div>
                            <div
                                className={styles['values-card']}
                                data-stack="v"
                                data-gap="sm"
                                data-p="md"
                            >
                                {effect.values.map((mapping, mappingIndex) => (
                                    <Fragment key={mapping.id}>
                                        {mappingIndex > 0 && <Divider />}
                                        <MappingRow
                                            effect={effect}
                                            mapping={mapping}
                                            columns={columns}
                                            parameters={parameters}
                                            disabled={disabled}
                                        />
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
            {index < effectsCount - 1 && <Divider />}
        </>
    );
};
