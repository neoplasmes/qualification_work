import { X } from 'lucide-react';

import type { DatasetMetadata } from '@/entities/dataset';

import { IconButton, TextInput } from '@/shared/ui';

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
                <div
                    className={styles['source-toggle']}
                    data-display="inline-flex"
                    role="group"
                    aria-label="Value source"
                >
                    <button
                        type="button"
                        data-test-id={actionsTestIds.mappingSourceParameterButton}
                        className={`${styles['source-btn']} ${
                            mapping.sourceKind === 'parameter' ? styles['active'] : ''
                        }`}
                        disabled={disabled}
                        aria-pressed={mapping.sourceKind === 'parameter'}
                        onClick={() =>
                            onUpdateMapping(effect.id, mapping.id, {
                                sourceKind: 'parameter',
                            })
                        }
                    >
                        param
                    </button>
                    <button
                        type="button"
                        data-test-id={actionsTestIds.mappingSourceLiteralButton}
                        className={`${styles['source-btn']} ${
                            mapping.sourceKind === 'literal' ? styles['active'] : ''
                        }`}
                        disabled={disabled}
                        aria-pressed={mapping.sourceKind === 'literal'}
                        onClick={() =>
                            onUpdateMapping(effect.id, mapping.id, {
                                sourceKind: 'literal',
                            })
                        }
                    >
                        literal
                    </button>
                </div>
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
            className={styles['value-icon-button']}
            tone="transparent"
            iconStrokeWidth={2.6}
            data-test-id={actionsTestIds.removeValueButton}
            aria-label="Remove value"
            disabled={disabled || effect.values.length === 1}
            onClick={() =>
                onUpdateEffect(effect.id, {
                    values: effect.values.filter(item => item.id !== mapping.id),
                })
            }
        >
            <X size={22} />
        </IconButton>
    </div>
);
