import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { getEffectLabel } from '@/entities/action';

import { IconButton } from '@/shared/ui';

import { moveItem } from '../../lib';
import type { ActionDraft, ActionEffectDraft } from '../../model';

import styles from './EffectEditor.module.scss';

type EffectHeaderProps = {
    index: number;
    effectsCount: number;
    effect: ActionEffectDraft;
    disabled: boolean;
    collapsed: boolean;
    summary: string;
    onToggleCollapse: () => void;
    onDraftChange: Dispatch<SetStateAction<ActionDraft>>;
};

export const EffectHeader = ({
    index,
    effectsCount,
    effect,
    disabled,
    collapsed,
    summary,
    onToggleCollapse,
    onDraftChange,
}: EffectHeaderProps) => (
    <div data-stack="h" data-gap="sm" data-align="start" data-justify="between">
        <div data-stack="v" data-gap="xs">
            <span className={styles['eyebrow']}>Effect {index + 1}</span>
            <h4 className={styles['section-title']}>{getEffectLabel(effect.kind)}</h4>
            {collapsed && <p className={styles['muted']}>{summary}</p>}
        </div>
        <div data-stack="h" data-gap="xs">
            <IconButton
                tone="nav"
                aria-label={collapsed ? 'Expand effect' : 'Collapse effect'}
                onClick={onToggleCollapse}
            >
                {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </IconButton>
            <IconButton
                tone="nav"
                aria-label="Move effect up"
                disabled={disabled || index === 0}
                onClick={() =>
                    onDraftChange(current => ({
                        ...current,
                        effects: moveItem(current.effects, index, -1),
                    }))
                }
            >
                <ArrowUp size={20} />
            </IconButton>
            <IconButton
                tone="nav"
                aria-label="Move effect down"
                disabled={disabled || index === effectsCount - 1}
                onClick={() =>
                    onDraftChange(current => ({
                        ...current,
                        effects: moveItem(current.effects, index, 1),
                    }))
                }
            >
                <ArrowDown size={20} />
            </IconButton>
            <IconButton
                tone="nav"
                aria-label="Remove effect"
                disabled={disabled || effectsCount === 1}
                onClick={() =>
                    onDraftChange(current => ({
                        ...current,
                        effects: current.effects.filter(item => item.id !== effect.id),
                    }))
                }
            >
                <X size={20} />
            </IconButton>
        </div>
    </div>
);
