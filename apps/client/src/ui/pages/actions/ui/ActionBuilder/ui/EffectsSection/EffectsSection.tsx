import { Button, Text } from '@qualification-work/design-system';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import type { DatasetMetadata } from '@/app/ports/repos/dataset';

import { actionBuilderTestIds } from '../../const';
import { actionBuilderConfig, createBlankEffectDraft } from '../../model';
import { EffectEditor } from '../EffectEditor';

import styles from '../../actionBuilder.module.css';

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
        <section className={styles['section-card']}>
            <div data-stack="h" data-gap="sm" data-align="start" data-justify="between">
                <div>
                    <Text
                        as="h3"
                        variant="heading-sm"
                        className={styles['section-title']}
                    >
                        Что делать с данными
                    </Text>
                    <p>Изменения выполняются последовательно, сверху вниз.</p>
                </div>
                <Button
                    data-test-id={actionBuilderTestIds.addEffectButton}
                    disabled={disabled}
                    onClick={handleAddEffect}
                >
                    <Plus size={18} />
                    Добавить изменение
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
        </section>
    );
};
