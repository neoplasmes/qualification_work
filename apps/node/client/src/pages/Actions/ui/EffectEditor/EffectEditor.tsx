import { Plus } from 'lucide-react';
import { Fragment, useMemo, type Dispatch, type SetStateAction } from 'react';

import type { DatasetMetadata } from '@/entities/dataset';

import { Button, Separator } from '@/shared/ui';

import { actionsTestIds } from '../../const';
import { createBlankValueMappingDraft, getDatasetColumns } from '../../lib';
import type {
    ActionDraft,
    ActionEffectDraft,
    ActionParameterDraft,
    ActionValueMappingDraft,
} from '../../model';
import { EffectFields } from './EffectFields';
import { EffectHeader } from './EffectHeader';
import { MappingRow } from './MappingRow';

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
    onDraftChange: Dispatch<SetStateAction<ActionDraft>>;
    onUpdateEffect: (effectId: string, patch: Partial<ActionEffectDraft>) => void;
    onUpdateMapping: (
        effectId: string,
        mappingId: string,
        patch: Partial<ActionValueMappingDraft>
    ) => void;
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
    onDraftChange,
    onUpdateEffect,
    onUpdateMapping,
}: EffectEditorProps) => {
    const columns = useMemo(
        () => getDatasetColumns(datasets, effect.datasetId),
        [datasets, effect.datasetId]
    );
    const summary = useMemo(() => {
        const datasetName = datasets.find(d => d.dataset.id === effect.datasetId)?.dataset
            .name;
        const valuesPart = `${effect.values.length} value${effect.values.length !== 1 ? 's' : ''}`;

        return datasetName ? `${datasetName} · ${valuesPart}` : valuesPart;
    }, [datasets, effect.datasetId, effect.values.length]);

    return (
        <>
            <div
                className={styles['effect-section']}
                data-display="grid"
                data-gap="md"
                data-py="md"
                data-test-id={actionsTestIds.effectCard}
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
                    onDraftChange={onDraftChange}
                />

                {!collapsed && (
                    <>
                        <div
                            className={styles['form-grid']}
                            data-display="grid"
                            data-gap="sm"
                            data-align="start"
                        >
                            <EffectFields
                                effect={effect}
                                parameters={parameters}
                                columns={columns}
                                datasets={datasets}
                                disabled={disabled}
                                onUpdateEffect={onUpdateEffect}
                            />
                        </div>

                        <div data-display="grid" data-gap="sm">
                            <div
                                data-stack="h"
                                data-gap="sm"
                                data-align="center"
                                data-justify="between"
                            >
                                <span className={styles['eyebrow']}>Column values</span>
                                <Button
                                    className={styles['add-value-button']}
                                    tone="transparent"
                                    data-test-id={actionsTestIds.addValueButton}
                                    disabled={disabled}
                                    onClick={() =>
                                        onUpdateEffect(effect.id, {
                                            values: [
                                                ...effect.values,
                                                createBlankValueMappingDraft(),
                                            ],
                                        })
                                    }
                                >
                                    <Plus size={18} />
                                    Add value
                                </Button>
                            </div>
                            <div
                                className={styles['values-card']}
                                data-display="grid"
                                data-gap="sm"
                                data-p="md"
                            >
                                {effect.values.map((mapping, mappingIndex) => (
                                    <Fragment key={mapping.id}>
                                        {mappingIndex > 0 && <Separator />}
                                        <MappingRow
                                            effect={effect}
                                            mapping={mapping}
                                            columns={columns}
                                            parameters={parameters}
                                            disabled={disabled}
                                            onUpdateEffect={onUpdateEffect}
                                            onUpdateMapping={onUpdateMapping}
                                        />
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
            {index < effectsCount - 1 && <Separator />}
        </>
    );
};
