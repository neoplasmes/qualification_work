import { Plus } from 'lucide-react';
import { useState } from 'react';

import type { DatasetMetadata } from '@/entities/dataset';

import { Button, Card } from '@/shared/ui';

import { actionBuilderTestIds } from '../../const';
import { actionBuilderConfig, createBlankEffectDraft } from '../../model';
import { EffectEditor } from '../EffectEditor';

import styles from '../../ActionBuilder.module.scss';

type EffectsSectionProps = {
    datasets: DatasetMetadata[];
    disabled: boolean;
};

export const EffectsSection = ({ datasets, disabled }: EffectsSectionProps) => {
    const [collapsedEffects, setCollapsedEffects] = useState<Set<string>>(new Set());
    const snapshot = actionBuilderConfig.useConfig();
    const draft = snapshot.draft;

    const handleAddEffect = () => {
        snapshot.mutateDraft(nextDraft => {
            nextDraft.effects.push(createBlankEffectDraft());
        });
    };

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
        <Card className={styles['section-card']}>
            <div data-stack="h" data-gap="sm" data-align="start" data-justify="between">
                <div>
                    <h3 className={styles['section-title']}>Effects</h3>
                    <p>Effects run top to bottom in one backend transaction.</p>
                </div>
                <Button
                    data-test-id={actionBuilderTestIds.addEffectButton}
                    disabled={disabled}
                    onClick={handleAddEffect}
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
                />
            ))}
        </Card>
    );
};
