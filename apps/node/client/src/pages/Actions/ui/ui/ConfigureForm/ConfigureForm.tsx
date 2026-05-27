import { Plus } from 'lucide-react';
import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';

import type { DatasetMetadata } from '@/entities/dataset';

import { Button, Card } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import { createBlankEffectDraft, createBlankParameterDraft } from '../../../lib';
import type {
    ActionDraft,
    ActionEffectDraft,
    ActionParameterDraft,
    ActionValueMappingDraft,
} from '../../../model';

import { EffectEditor } from '../EffectEditor';
import { ParameterRow } from './ParameterRow';

import styles from './ConfigureForm.module.scss';

type ConfigureFormProps = {
    draft: ActionDraft;
    datasets: DatasetMetadata[];
    disabled: boolean;
    formId: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onDraftChange: Dispatch<SetStateAction<ActionDraft>>;
    onUpdateParameter: (
        parameterId: string,
        patch: Partial<ActionParameterDraft>
    ) => void;
    onUpdateEffect: (effectId: string, patch: Partial<ActionEffectDraft>) => void;
    onUpdateMapping: (
        effectId: string,
        mappingId: string,
        patch: Partial<ActionValueMappingDraft>
    ) => void;
};

export const ConfigureForm = ({
    draft,
    datasets,
    disabled,
    formId,
    onSubmit,
    onDraftChange,
    onUpdateParameter,
    onUpdateEffect,
    onUpdateMapping,
}: ConfigureFormProps) => {
    const [collapsedEffects, setCollapsedEffects] = useState<Set<string>>(new Set());

    const toggleEffect = (effectId: string) =>
        setCollapsedEffects(prev => {
            const next = new Set(prev);
            if (next.has(effectId)) {
                next.delete(effectId);
            } else {
                next.add(effectId);
            }

            return next;
        });

    return (
        <form
            id={formId}
            className={styles['stack']}
            data-display="grid"
            data-gap="sm"
            data-test-id={actionsTestIds.configureForm}
            onSubmit={onSubmit}
        >
            <Card
                className={styles['card']}
                data-display="grid"
                data-gap="md"
                data-p="md"
            >
                <div
                    data-stack="h"
                    data-gap="sm"
                    data-align="start"
                    data-justify="between"
                >
                    <div>
                        <h3 className={styles['section-title']}>Parameters</h3>
                        <p>Values the user enters before running the action.</p>
                    </div>
                    <Button
                        data-test-id={actionsTestIds.addParameterButton}
                        disabled={disabled}
                        onClick={() =>
                            onDraftChange(current => ({
                                ...current,
                                parameters: [
                                    ...current.parameters,
                                    createBlankParameterDraft(),
                                ],
                            }))
                        }
                    >
                        <Plus size={18} />
                        Add parameter
                    </Button>
                </div>

                {draft.parameters.map(parameter => (
                    <ParameterRow
                        key={parameter.id}
                        parametersCount={draft.parameters.length}
                        disabled={disabled}
                        parameter={parameter}
                        onDraftChange={onDraftChange}
                        onUpdateParameter={onUpdateParameter}
                    />
                ))}
            </Card>

            <Card
                className={styles['card']}
                data-display="grid"
                data-gap="md"
                data-p="md"
            >
                <div
                    data-stack="h"
                    data-gap="sm"
                    data-align="start"
                    data-justify="between"
                >
                    <div>
                        <h3 className={styles['section-title']}>Effects</h3>
                        <p>Effects run top to bottom in one backend transaction.</p>
                    </div>
                    <Button
                        data-test-id={actionsTestIds.addEffectButton}
                        disabled={disabled}
                        onClick={() =>
                            onDraftChange(current => ({
                                ...current,
                                effects: [...current.effects, createBlankEffectDraft()],
                            }))
                        }
                    >
                        <Plus size={18} />
                        Add effect
                    </Button>
                </div>

                {draft.effects.map((effect, index) => (
                    <EffectEditor
                        key={effect.id}
                        effect={effect}
                        index={index}
                        parameters={draft.parameters}
                        effectsCount={draft.effects.length}
                        datasets={datasets}
                        disabled={disabled}
                        collapsed={collapsedEffects.has(effect.id)}
                        onToggleCollapse={() => toggleEffect(effect.id)}
                        onDraftChange={onDraftChange}
                        onUpdateEffect={onUpdateEffect}
                        onUpdateMapping={onUpdateMapping}
                    />
                ))}
            </Card>
        </form>
    );
};
