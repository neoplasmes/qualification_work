import { X } from 'lucide-react';

import type { DatasetMetadata } from '@/entities/dataset';

import { FormField, IconButton, SegmentedTabs, TextInput } from '@/shared/ui';

import { actionsTestIds } from '../../../const';
import type {
    ActionEffectDraft,
    ActionParameterDraft,
    ActionValueMappingDraft,
} from '../../../model';

import { ColumnSelect, ParameterSelect } from './SelectControls';

import styles from './EffectEditor.module.scss';

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
        data-test-id={actionsTestIds.mappingRow}
        data-mapping-id={mapping.id}
    >
        <FormField label="Column">
            <ColumnSelect
                testId={actionsTestIds.mappingColumnSelect}
                columns={columns}
                value={mapping.columnKey}
                disabled={disabled}
                onChange={value =>
                    onUpdateMapping(effect.id, mapping.id, { columnKey: value })
                }
            />
        </FormField>
        <FormField
            label={
                <div className={styles['value-header']}>
                    <span>Value</span>
                </div>
            }
        >
            <SegmentedTabs
                value={mapping.sourceKind}
                disabled={disabled}
                options={[
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
                ]}
                onChange={value =>
                    onUpdateMapping(effect.id, mapping.id, { sourceKind: value })
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
        </FormField>
        <IconButton
            data-test-id={actionsTestIds.removeValueButton}
            aria-label="Remove value"
            disabled={disabled || effect.values.length === 1}
            onClick={() =>
                onUpdateEffect(effect.id, {
                    values: effect.values.filter(item => item.id !== mapping.id),
                })
            }
        >
            <X size={16} />
        </IconButton>
    </div>
);
