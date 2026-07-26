import { getEffectLabel } from '@/ui/pages/actions/lib';
import { IconButton, Text } from '@qualification-work/design-system';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, X } from 'lucide-react';

import { actionBuilderConfig, type ActionEffectDraft } from '../../model';

import styles from '../EffectEditor/effectEditor.module.css';

type EffectHeaderProps = {
    index: number;
    effectsCount: number;
    effect: ActionEffectDraft;
    disabled: boolean;
    collapsed: boolean;
    summary: string;
    onToggleCollapse: () => void;
};

export const EffectHeader = ({
    index,
    effectsCount,
    effect,
    disabled,
    collapsed,
    summary,
    onToggleCollapse,
}: EffectHeaderProps) => {
    const snapshot = actionBuilderConfig.useConfig();

    const handleMoveEffectUp = () => {
        snapshot.mutateDraft(draft => {
            const [item] = draft.effects.splice(index, 1);

            draft.effects.splice(index - 1, 0, item);
        });
    };

    const handleMoveEffectDown = () => {
        snapshot.mutateDraft(draft => {
            const [item] = draft.effects.splice(index, 1);

            draft.effects.splice(index + 1, 0, item);
        });
    };

    const handleRemoveEffect = () => {
        snapshot.mutateDraft(draft => {
            draft.effects = draft.effects.filter(item => item.id !== effect.id);
        });
    };

    return (
        <div data-stack="h" data-gap="sm" data-align="start" data-justify="between">
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>Изменение {index + 1}</span>
                <Text as="h4" variant="heading-sm" className={styles['section-title']}>
                    {getEffectLabel(effect.kind)}
                </Text>
                {collapsed && <p className={styles['muted']}>{summary}</p>}
            </div>
            <div data-stack="h" data-gap="xs">
                <IconButton
                    variant="ghost"
                    aria-label={collapsed ? 'Развернуть изменение' : 'Свернуть изменение'}
                    onClick={onToggleCollapse}
                >
                    {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </IconButton>
                <IconButton
                    variant="ghost"
                    aria-label="Переместить выше"
                    disabled={disabled || index === 0}
                    onClick={handleMoveEffectUp}
                >
                    <ArrowUp size={20} />
                </IconButton>
                <IconButton
                    variant="ghost"
                    aria-label="Переместить ниже"
                    disabled={disabled || index === effectsCount - 1}
                    onClick={handleMoveEffectDown}
                >
                    <ArrowDown size={20} />
                </IconButton>
                <IconButton
                    variant="ghost"
                    aria-label="Удалить изменение"
                    disabled={disabled || effectsCount === 1}
                    onClick={handleRemoveEffect}
                >
                    <X size={20} />
                </IconButton>
            </div>
        </div>
    );
};
