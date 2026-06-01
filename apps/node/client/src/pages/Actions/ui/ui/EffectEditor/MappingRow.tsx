import { X } from 'lucide-react';

import type { DatasetMetadata } from '@/entities/dataset';

import {
    IconButton,
    SegmentedControl,
    TextInput,
    type SegmentedControlOption,
} from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import type {
    ActionEffectDraft,
    ActionParameterDraft,
    ActionValueMappingDraft,
} from '../../../model';

import { ColumnSelect, ParameterSelect } from './SelectControls';

import styles from './EffectEditor.module.scss';

const mappingSourceOptions = [
    {
        value: 'parameter',
        label: 'param',
        testId: actionsTestIds.mappingSourceParameterButton,
    },
    {
        value: 'literal',
        label: 'literal',
        testId: actionsTestIds.mappingSourceLiteralButton,
    },
] as const satisfies readonly SegmentedControlOption<
    ActionValueMappingDraft['sourceKind']
>[];

type MappingRowProps = {
    effect: ActionEffectDraft;
    mapping: ActionValueMappingDraft;
    columns: DatasetMetadata['columns'];
    parameters: ActionParameterDraft[];
    disabled: boolean;
    onUpdateEffect: (effectId: string, patch: Partial<ActionEffectDraft>) => void;
    onUpdateMapping: (
        effectId: string,
        mappingId: string,
        patch: Partial<ActionValueMappingDraft>
    ) => void;
};

export const MappingRow = ({
    effect,
    mapping,
    columns,
    parameters,
    disabled,
    onUpdateEffect,
    onUpdateMapping,
}: MappingRowProps) => (
    <div
        className={styles['mapping-row']}
        data-display="grid"
        data-gap="sm"
        data-align="end"
        data-test-id={actionsTestIds.mappingRow}
        data-mapping-id={mapping.id}
    >
        <div className={styles['mapping-fields']} data-display="grid">
            <div
                className={styles['mapping-header']}
                data-display="grid"
                data-gap="sm"
                data-align="center"
            >
                <span className={styles['control-label']}>Column</span>
                <SegmentedControl
                    value={mapping.sourceKind}
                    options={mappingSourceOptions}
                    ariaLabel="Value source"
                    className={styles['source-toggle']}
                    disabled={disabled}
                    onChange={sourceKind =>
                        onUpdateMapping(effect.id, mapping.id, { sourceKind })
                    }
                />
            </div>
            <ColumnSelect
                testId={actionsTestIds.mappingColumnSelect}
                columns={columns}
                value={mapping.columnKey}
                disabled={disabled}
                onChange={value =>
                    onUpdateMapping(effect.id, mapping.id, { columnKey: value })
                }
            />
            {mapping.sourceKind === 'parameter' ? (
                <ParameterSelect
                    testId={actionsTestIds.mappingParameterSelect}
                    parameters={parameters}
                    value={mapping.parameterKey}
                    disabled={disabled}
                    onChange={value =>
                        onUpdateMapping(effect.id, mapping.id, { parameterKey: value })
                    }
                />
            ) : (
                <TextInput
                    data-test-id={actionsTestIds.mappingLiteralInput}
                    value={mapping.literalValue}
                    disabled={disabled}
                    placeholder="Paid"
                    onChange={event =>
                        onUpdateMapping(effect.id, mapping.id, {
                            literalValue: event.target.value,
                        })
                    }
                />
            )}
        </div>
        <IconButton
            tone="nav"
            data-test-id={actionsTestIds.removeValueButton}
            aria-label="Remove value"
            disabled={disabled || effect.values.length === 1}
            onClick={() =>
                onUpdateEffect(effect.id, {
                    values: effect.values.filter(item => item.id !== mapping.id),
                })
            }
        >
            <X size={20} />
        </IconButton>
    </div>
);
