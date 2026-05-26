import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import type { DatasetMetadata } from '@/entities/dataset';

import { Button, IconButton } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import {
    createBlankValueMappingDraft,
    getDatasetColumns,
    getEffectLabel,
    moveItem,
} from '../../../lib';
import type {
    ActionDraft,
    ActionEffectDraft,
    ActionValueMappingDraft,
} from '../../../model';

import { EffectFields } from './EffectFields';
import { MappingRow } from './MappingRow';

import styles from './EffectEditor.module.scss';

type EffectEditorProps = {
    effect: ActionEffectDraft;
    index: number;
    draft: ActionDraft;
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
    draft,
    datasets,
    disabled,
    collapsed,
    onToggleCollapse,
    onDraftChange,
    onUpdateEffect,
    onUpdateMapping,
}: EffectEditorProps) => {
    const columns = getDatasetColumns(datasets, effect.datasetId);
    const datasetName = datasets.find(d => d.dataset.id === effect.datasetId)?.dataset
        .name;
    const summary = datasetName
        ? `${datasetName} · ${effect.values.length} value${effect.values.length !== 1 ? 's' : ''}`
        : `${effect.values.length} value${effect.values.length !== 1 ? 's' : ''}`;

    return (
        <div
            className={`${styles['card']} ${styles['effect-card']}`}
            data-test-id={actionsTestIds.effectCard}
            data-effect-id={effect.id}
        >
            <EffectHeader
                index={index}
                draft={draft}
                effect={effect}
                disabled={disabled}
                collapsed={collapsed}
                summary={summary}
                onToggleCollapse={onToggleCollapse}
                onDraftChange={onDraftChange}
            />

            {!collapsed && (
                <>
                    <div className={styles['form-grid']}>
                        <EffectFields
                            effect={effect}
                            draft={draft}
                            columns={columns}
                            datasets={datasets}
                            disabled={disabled}
                            onUpdateEffect={onUpdateEffect}
                        />
                    </div>

                    <div className={styles['stack']}>
                        <div className={styles['actions-row']}>
                            <span className={styles['eyebrow']}>Column values</span>
                            <Button
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
                        {effect.values.map(mapping => (
                            <MappingRow
                                key={mapping.id}
                                effect={effect}
                                mapping={mapping}
                                columns={columns}
                                draft={draft}
                                disabled={disabled}
                                onUpdateEffect={onUpdateEffect}
                                onUpdateMapping={onUpdateMapping}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

type EffectHeaderProps = {
    index: number;
    draft: ActionDraft;
    effect: ActionEffectDraft;
    disabled: boolean;
    collapsed: boolean;
    summary: string;
    onToggleCollapse: () => void;
    onDraftChange: Dispatch<SetStateAction<ActionDraft>>;
};

const EffectHeader = ({
    index,
    draft,
    effect,
    disabled,
    collapsed,
    summary,
    onToggleCollapse,
    onDraftChange,
}: EffectHeaderProps) => (
    <div className={styles['card-header']}>
        <div data-stack="v" data-gap="xs">
            <span className={styles['eyebrow']}>Effect {index + 1}</span>
            <h4 className={styles['section-title']}>{getEffectLabel(effect.kind)}</h4>
            {collapsed && <p className={styles['muted']}>{summary}</p>}
        </div>
        <div data-stack="h" data-gap="xs">
            <IconButton
                aria-label={collapsed ? 'Expand effect' : 'Collapse effect'}
                onClick={onToggleCollapse}
            >
                {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </IconButton>
            <IconButton
                aria-label="Move effect up"
                disabled={disabled || index === 0}
                onClick={() =>
                    onDraftChange(current => ({
                        ...current,
                        effects: moveItem(current.effects, index, -1),
                    }))
                }
            >
                <ArrowUp size={16} />
            </IconButton>
            <IconButton
                aria-label="Move effect down"
                disabled={disabled || index === draft.effects.length - 1}
                onClick={() =>
                    onDraftChange(current => ({
                        ...current,
                        effects: moveItem(current.effects, index, 1),
                    }))
                }
            >
                <ArrowDown size={16} />
            </IconButton>
            <IconButton
                aria-label="Remove effect"
                disabled={disabled || draft.effects.length === 1}
                onClick={() =>
                    onDraftChange(current => ({
                        ...current,
                        effects: current.effects.filter(item => item.id !== effect.id),
                    }))
                }
            >
                <X size={16} />
            </IconButton>
        </div>
    </div>
);
