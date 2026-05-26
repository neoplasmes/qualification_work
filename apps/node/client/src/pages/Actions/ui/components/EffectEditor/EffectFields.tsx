import type { DatasetMetadata } from '@/entities/dataset';

import { actionsTestIds } from '../../../const';
import type { ActionEffectDraft, ActionParameterDraft } from '../../../model';

import { ColumnSelect, ParameterSelect } from './SelectControls';

import styles from './EffectEditor.module.scss';

type EffectFieldsProps = {
    effect: ActionEffectDraft;
    parameters: ActionParameterDraft[];
    columns: DatasetMetadata['columns'];
    datasets: DatasetMetadata[];
    disabled: boolean;
    onUpdateEffect: (effectId: string, patch: Partial<ActionEffectDraft>) => void;
};

export const EffectFields = ({
    effect,
    parameters,
    columns,
    datasets,
    disabled,
    onUpdateEffect,
}: EffectFieldsProps) => (
    <>
        <label className={styles['control']}>
            <span>Type</span>
            <select
                data-test-id={actionsTestIds.effectTypeSelect}
                value={effect.kind}
                disabled={disabled}
                onChange={event =>
                    onUpdateEffect(effect.id, {
                        kind: event.target.value as ActionEffectDraft['kind'],
                    })
                }
            >
                <option value="insertRow">Insert row</option>
                <option value="updateRowsByMatch">Update rows by match</option>
            </select>
        </label>
        <label className={styles['control']}>
            <span>Dataset</span>
            <select
                data-test-id={actionsTestIds.effectDatasetSelect}
                value={effect.datasetId}
                disabled={disabled}
                onChange={event =>
                    onUpdateEffect(effect.id, { datasetId: event.target.value })
                }
            >
                <option value="">Select dataset</option>
                {datasets.map(item => (
                    <option key={item.dataset.id} value={item.dataset.id}>
                        {item.dataset.name}
                    </option>
                ))}
            </select>
        </label>
        {effect.kind === 'updateRowsByMatch' && (
            <>
                <label className={styles['control']}>
                    <span>Match column</span>
                    <ColumnSelect
                        testId={actionsTestIds.effectMatchColumnSelect}
                        columns={columns}
                        value={effect.matchColumnKey}
                        disabled={disabled}
                        onChange={value =>
                            onUpdateEffect(effect.id, { matchColumnKey: value })
                        }
                    />
                </label>
                <label className={styles['control']}>
                    <span>Match parameter</span>
                    <ParameterSelect
                        testId={actionsTestIds.effectMatchParameterSelect}
                        parameters={parameters}
                        value={effect.matchParameterKey}
                        disabled={disabled}
                        onChange={value =>
                            onUpdateEffect(effect.id, { matchParameterKey: value })
                        }
                    />
                </label>
                <label className={styles['control']}>
                    <span>Max rows</span>
                    <input
                        data-test-id={actionsTestIds.effectMaxRowsInput}
                        type="number"
                        min={1}
                        value={effect.maxRows}
                        disabled={disabled}
                        onChange={event =>
                            onUpdateEffect(effect.id, { maxRows: event.target.value })
                        }
                    />
                </label>
            </>
        )}
    </>
);
