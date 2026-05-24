import { skipToken } from '@reduxjs/toolkit/query';
import {
    ArrowDown,
    ArrowUp,
    Play,
    Plus,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    useArchiveActionMutation,
    useCreateActionMutation,
    useExecuteActionMutation,
    useListActionsQuery,
    usePatchActionMutation,
    type Action,
} from '@/features/actions';
import { useActiveOrganization, useGetMeQuery } from '@/features/auth';
import { useListDatasetsQuery, type DatasetMetadata } from '@/features/datasets';

import { getApiErrorMessage } from '@/shared/api';
import { Button, IconButton } from '@/shared/ui';

import {
    actionToDraft,
    coerceRunValues,
    createBlankActionDraft,
    createBlankEffectDraft,
    createBlankParameterDraft,
    createBlankValueMappingDraft,
    draftToActionPayload,
    getDefaultRunValues,
    type ActionDraft,
    type ActionEffectDraft,
    type ActionParameterDraft,
    type ActionValueMappingDraft,
} from '../model/actionDraft';
import {
    cancelCreateAction,
    selectAction,
    selectActionsWorkspaceTab,
    selectIsCreatingAction,
    selectSelectedActionId,
    setActionsWorkspaceTab,
} from '../model/actionsPageSlice';

import styles from './ActionsPage.module.scss';

const canMutate = (role: string | undefined) => role === 'owner' || role === 'editor';

const getSelectedAction = (
    actions: Action[] | undefined,
    selectedActionId: string | null
) => {
    if (!actions || actions.length === 0) {
        return undefined;
    }

    return actions.find(action => action.id === selectedActionId) ?? actions[0];
};

const getDatasetColumns = (datasets: DatasetMetadata[] | undefined, datasetId: string) =>
    datasets?.find(item => item.dataset.id === datasetId)?.columns ?? [];

const moveItem = <T,>(items: T[], index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) {
        return items;
    }

    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);

    return next;
};

export const ActionsWorkspace = () => {
    const dispatch = useDispatch();
    const [draft, setDraft] = useState<ActionDraft>(() => createBlankActionDraft());
    const [draftSourceId, setDraftSourceId] = useState<string | null>(null);
    const [runValues, setRunValues] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const [lastRunMessage, setLastRunMessage] = useState('');
    const [archiveConfirmationId, setArchiveConfirmationId] = useState<string | null>(null);

    const workspaceTab = useSelector(selectActionsWorkspaceTab);
    const selectedActionId = useSelector(selectSelectedActionId);
    const isCreatingAction = useSelector(selectIsCreatingAction);

    const meQuery = useGetMeQuery();
    const { activeOrg: org } = useActiveOrganization(meQuery.data);
    const actionsQuery = useListActionsQuery(org?.id ?? skipToken);
    const datasetsQuery = useListDatasetsQuery(org?.id ?? skipToken);

    const selectedAction = useMemo(
        () => (isCreatingAction ? undefined : getSelectedAction(actionsQuery.data, selectedActionId)),
        [actionsQuery.data, isCreatingAction, selectedActionId]
    );
    const editable = canMutate(org?.role);

    const [createAction, createState] = useCreateActionMutation();
    const [patchAction, patchState] = usePatchActionMutation();
    const [archiveAction, archiveState] = useArchiveActionMutation();
    const [executeAction, executeState] = useExecuteActionMutation();

    useEffect(() => {
        if (isCreatingAction) {
            if (draftSourceId !== 'new') {
                setDraft(createBlankActionDraft());
                setDraftSourceId('new');
                setRunValues({});
                setError('');
                setLastRunMessage('');
            }

            return;
        }

        if (!selectedAction) {
            setDraftSourceId(null);
            setDraft(createBlankActionDraft());
            setRunValues({});

            return;
        }

        if (draftSourceId === selectedAction.id) {
            return;
        }

        setDraft(actionToDraft(selectedAction));
        setDraftSourceId(selectedAction.id);
        setRunValues(getDefaultRunValues(selectedAction.parameters));
        setError('');
        setLastRunMessage('');
        setArchiveConfirmationId(null);
    }, [draftSourceId, isCreatingAction, selectedAction]);

    const updateParameter = (
        parameterId: string,
        patch: Partial<ActionParameterDraft>
    ) => {
        setDraft(current => ({
            ...current,
            parameters: current.parameters.map(parameter =>
                parameter.id === parameterId ? { ...parameter, ...patch } : parameter
            ),
        }));
    };

    const updateEffect = (effectId: string, patch: Partial<ActionEffectDraft>) => {
        setDraft(current => ({
            ...current,
            effects: current.effects.map(effect =>
                effect.id === effectId ? { ...effect, ...patch } : effect
            ),
        }));
    };

    const updateMapping = (
        effectId: string,
        mappingId: string,
        patch: Partial<ActionValueMappingDraft>
    ) => {
        setDraft(current => ({
            ...current,
            effects: current.effects.map(effect =>
                effect.id === effectId
                    ? {
                          ...effect,
                          values: effect.values.map(mapping =>
                              mapping.id === mappingId ? { ...mapping, ...patch } : mapping
                          ),
                      }
                    : effect
            ),
        }));
    };

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!org || !editable) {
            return;
        }

        try {
            setError('');
            const payload = draftToActionPayload(draft);
            if (isCreatingAction) {
                const created = await createAction({ orgId: org.id, ...payload }).unwrap();
                dispatch(cancelCreateAction());
                dispatch(selectAction(created.id));
                setDraftSourceId(null);
            } else if (selectedAction) {
                const saved = await patchAction({ actionId: selectedAction.id, ...payload }).unwrap();
                dispatch(selectAction(saved.id));
                setDraftSourceId(null);
            }
            await actionsQuery.refetch();
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : getApiErrorMessage(saveError, 'Unable to save this action.')
            );
        }
    };

    const handleArchive = async () => {
        if (!selectedAction || !editable) {
            return;
        }

        if (archiveConfirmationId !== selectedAction.id) {
            setArchiveConfirmationId(selectedAction.id);

            return;
        }

        try {
            setError('');
            await archiveAction(selectedAction.id).unwrap();
            dispatch(selectAction(null));
            setArchiveConfirmationId(null);
            await actionsQuery.refetch();
        } catch (archiveError) {
            setError(getApiErrorMessage(archiveError, 'Unable to archive this action.'));
        }
    };

    const handleRun = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedAction || !editable) {
            return;
        }

        try {
            setError('');
            setLastRunMessage('');
            const parameters = coerceRunValues(selectedAction.parameters, runValues);
            const result = await executeAction({ actionId: selectedAction.id, parameters }).unwrap();
            setLastRunMessage(
                result.status === 'success'
                    ? `Run completed with ${result.changes.length} changes.`
                    : (result.errorMessage ?? 'Run failed.')
            );
        } catch (runError) {
            setError(
                runError instanceof Error
                    ? runError.message
                    : getApiErrorMessage(runError, 'Unable to run this action.')
            );
        }
    };

    if (!selectedAction && !isCreatingAction) {
        return (
            <section className={styles['workspace']} aria-label="Action details">
                <p className={styles['placeholder']}>Select or create an action.</p>
            </section>
        );
    }

    return (
        <section className={styles['workspace']} aria-label="Action details">
            <div className={styles['header-row']}>
                <div data-stack="v" data-gap="xs">
                    <span className={styles['eyebrow']}>{isCreatingAction ? 'New action' : 'Action'}</span>
                    <h2 className={styles['title']}>{draft.name.trim() || selectedAction?.name || 'Untitled action'}</h2>
                    <p className={styles['muted']}>
                        {draft.parameters.length} parameters, {draft.effects.length} effects
                    </p>
                </div>
                {!isCreatingAction && (
                    <Button
                        variant="danger"
                        disabled={!editable || archiveState.isLoading}
                        title={editable ? undefined : 'Only owners and editors can archive actions.'}
                        onClick={() => void handleArchive()}
                    >
                        <Trash2 size={18} />
                        {archiveConfirmationId === selectedAction?.id ? 'Confirm archive' : 'Archive'}
                    </Button>
                )}
            </div>

            <div className={styles['tabs']}>
                <button
                    type="button"
                    className={`${styles['tab']} ${workspaceTab === 'configure' ? styles['active'] : ''}`}
                    onClick={() => dispatch(setActionsWorkspaceTab('configure'))}
                >
                    Configure
                </button>
                <button
                    type="button"
                    className={`${styles['tab']} ${workspaceTab === 'run' ? styles['active'] : ''}`}
                    disabled={isCreatingAction}
                    onClick={() => dispatch(setActionsWorkspaceTab('run'))}
                >
                    Run
                </button>
            </div>

            {error && (
                <div role="alert" className={`${styles['status']} ${styles['error']}`}>
                    {error}
                </div>
            )}

            {!editable && (
                <div className={styles['status']}>Viewer role can inspect actions and history, but can not edit or run them.</div>
            )}

            {workspaceTab === 'configure' ? (
                <ConfigureForm
                    draft={draft}
                    datasets={datasetsQuery.data ?? []}
                    disabled={!editable || createState.isLoading || patchState.isLoading}
                    saving={createState.isLoading || patchState.isLoading}
                    onSubmit={handleSave}
                    onDraftChange={setDraft}
                    onUpdateParameter={updateParameter}
                    onUpdateEffect={updateEffect}
                    onUpdateMapping={updateMapping}
                />
            ) : (
                <RunForm
                    action={selectedAction}
                    runValues={runValues}
                    disabled={!editable || executeState.isLoading}
                    lastRunMessage={lastRunMessage}
                    onRunValueChange={(key, value) =>
                        setRunValues(current => ({ ...current, [key]: value }))
                    }
                    onSubmit={handleRun}
                />
            )}
        </section>
    );
};

type ConfigureFormProps = {
    draft: ActionDraft;
    datasets: DatasetMetadata[];
    disabled: boolean;
    saving: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onDraftChange: React.Dispatch<React.SetStateAction<ActionDraft>>;
    onUpdateParameter: (parameterId: string, patch: Partial<ActionParameterDraft>) => void;
    onUpdateEffect: (effectId: string, patch: Partial<ActionEffectDraft>) => void;
    onUpdateMapping: (
        effectId: string,
        mappingId: string,
        patch: Partial<ActionValueMappingDraft>
    ) => void;
};

const ConfigureForm = ({
    draft,
    datasets,
    disabled,
    saving,
    onSubmit,
    onDraftChange,
    onUpdateParameter,
    onUpdateEffect,
    onUpdateMapping,
}: ConfigureFormProps) => (
    <form className={styles['stack']} onSubmit={onSubmit}>
        <div className={styles['card']}>
            <div className={styles['form-grid']}>
                <label className={styles['control']}>
                    <span>Name</span>
                    <input
                        value={draft.name}
                        disabled={disabled}
                        placeholder="Receive payment"
                        onChange={event =>
                            onDraftChange(current => ({ ...current, name: event.target.value }))
                        }
                    />
                </label>
                <label className={styles['control']}>
                    <span>Description</span>
                    <textarea
                        value={draft.description}
                        disabled={disabled}
                        placeholder="What this action does"
                        onChange={event =>
                            onDraftChange(current => ({
                                ...current,
                                description: event.target.value,
                            }))
                        }
                    />
                </label>
            </div>
        </div>

        <div className={styles['card']}>
            <div className={styles['card-header']}>
                <div>
                    <h3 className={styles['section-title']}>Parameters</h3>
                    <p>Values the user enters before running the action.</p>
                </div>
                <Button
                    disabled={disabled}
                    onClick={() =>
                        onDraftChange(current => ({
                            ...current,
                            parameters: [...current.parameters, createBlankParameterDraft()],
                        }))
                    }
                >
                    <Plus size={18} />
                    Add parameter
                </Button>
            </div>

            {draft.parameters.map(parameter => (
                <div key={parameter.id} className={styles['parameter-row']}>
                    <label className={styles['control']}>
                        <span>Key</span>
                        <input
                            value={parameter.key}
                            disabled={disabled}
                            placeholder="amount"
                            onChange={event =>
                                onUpdateParameter(parameter.id, { key: event.target.value })
                            }
                        />
                    </label>
                    <label className={styles['control']}>
                        <span>Label</span>
                        <input
                            value={parameter.label}
                            disabled={disabled}
                            placeholder="Amount"
                            onChange={event =>
                                onUpdateParameter(parameter.id, { label: event.target.value })
                            }
                        />
                    </label>
                    <label className={styles['control']}>
                        <span>Type</span>
                        <select
                            value={parameter.type}
                            disabled={disabled}
                            onChange={event =>
                                onUpdateParameter(parameter.id, {
                                    type: event.target.value as ActionParameterDraft['type'],
                                })
                            }
                        >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="bool">Bool</option>
                        </select>
                    </label>
                    <label className={styles['checkbox-control']}>
                        <input
                            type="checkbox"
                            checked={parameter.required}
                            disabled={disabled}
                            onChange={event =>
                                onUpdateParameter(parameter.id, {
                                    required: event.target.checked,
                                })
                            }
                        />
                        <span>Required</span>
                    </label>
                    <IconButton
                        aria-label="Remove parameter"
                        disabled={disabled || draft.parameters.length === 1}
                        onClick={() =>
                            onDraftChange(current => ({
                                ...current,
                                parameters: current.parameters.filter(item => item.id !== parameter.id),
                            }))
                        }
                    >
                        <X size={16} />
                    </IconButton>
                </div>
            ))}
        </div>

        <div className={styles['card']}>
            <div className={styles['card-header']}>
                <div>
                    <h3 className={styles['section-title']}>Effects</h3>
                    <p>Effects run top to bottom in one backend transaction.</p>
                </div>
                <Button
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
                    draft={draft}
                    datasets={datasets}
                    disabled={disabled}
                    onDraftChange={onDraftChange}
                    onUpdateEffect={onUpdateEffect}
                    onUpdateMapping={onUpdateMapping}
                />
            ))}
        </div>

        <div className={styles['actions-row']}>
            <Button type="submit" disabled={disabled || saving}>
                <Save size={18} />
                Save action
            </Button>
        </div>
    </form>
);

type EffectEditorProps = {
    effect: ActionEffectDraft;
    index: number;
    draft: ActionDraft;
    datasets: DatasetMetadata[];
    disabled: boolean;
    onDraftChange: React.Dispatch<React.SetStateAction<ActionDraft>>;
    onUpdateEffect: (effectId: string, patch: Partial<ActionEffectDraft>) => void;
    onUpdateMapping: (
        effectId: string,
        mappingId: string,
        patch: Partial<ActionValueMappingDraft>
    ) => void;
};

const EffectEditor = ({
    effect,
    index,
    draft,
    datasets,
    disabled,
    onDraftChange,
    onUpdateEffect,
    onUpdateMapping,
}: EffectEditorProps) => {
    const columns = getDatasetColumns(datasets, effect.datasetId);

    return (
        <div className={`${styles['card']} ${styles['effect-card']}`}>
            <div className={styles['card-header']}>
                <div data-stack="v" data-gap="xs">
                    <span className={styles['eyebrow']}>Effect {index + 1}</span>
                    <h4 className={styles['section-title']}>
                        {effect.kind === 'insertRow' ? 'Insert row' : 'Update rows by match'}
                    </h4>
                </div>
                <div data-stack="h" data-gap="xs">
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

            <div className={styles['form-grid']}>
                <label className={styles['control']}>
                    <span>Type</span>
                    <select
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
                                columns={columns}
                                value={effect.matchColumnKey}
                                disabled={disabled}
                                onChange={value => onUpdateEffect(effect.id, { matchColumnKey: value })}
                            />
                        </label>
                        <label className={styles['control']}>
                            <span>Match parameter</span>
                            <ParameterSelect
                                parameters={draft.parameters}
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
            </div>

            <div className={styles['stack']}>
                <div className={styles['actions-row']}>
                    <span className={styles['eyebrow']}>Column values</span>
                    <Button
                        disabled={disabled}
                        onClick={() =>
                            onUpdateEffect(effect.id, {
                                values: [...effect.values, createBlankValueMappingDraft()],
                            })
                        }
                    >
                        <Plus size={18} />
                        Add value
                    </Button>
                </div>
                {effect.values.map(mapping => (
                    <div key={mapping.id} className={styles['mapping-row']}>
                        <label className={styles['control']}>
                            <span>Column</span>
                            <ColumnSelect
                                columns={columns}
                                value={mapping.columnKey}
                                disabled={disabled}
                                onChange={value =>
                                    onUpdateMapping(effect.id, mapping.id, { columnKey: value })
                                }
                            />
                        </label>
                        <label className={styles['control']}>
                            <span>Source</span>
                            <select
                                value={mapping.sourceKind}
                                disabled={disabled}
                                onChange={event =>
                                    onUpdateMapping(effect.id, mapping.id, {
                                        sourceKind: event.target.value as ActionValueMappingDraft['sourceKind'],
                                    })
                                }
                            >
                                <option value="parameter">Parameter</option>
                                <option value="literal">Literal</option>
                            </select>
                        </label>
                        <label className={styles['control']}>
                            <span>Parameter</span>
                            <ParameterSelect
                                parameters={draft.parameters}
                                value={mapping.parameterKey}
                                disabled={disabled || mapping.sourceKind !== 'parameter'}
                                onChange={value =>
                                    onUpdateMapping(effect.id, mapping.id, { parameterKey: value })
                                }
                            />
                        </label>
                        <label className={styles['control']}>
                            <span>Literal</span>
                            <input
                                value={mapping.literalValue}
                                disabled={disabled || mapping.sourceKind !== 'literal'}
                                placeholder="Paid"
                                onChange={event =>
                                    onUpdateMapping(effect.id, mapping.id, {
                                        literalValue: event.target.value,
                                    })
                                }
                            />
                        </label>
                        <IconButton
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
                ))}
            </div>
        </div>
    );
};

type ColumnSelectProps = {
    columns: DatasetMetadata['columns'];
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
};

const ColumnSelect = ({ columns, value, disabled, onChange }: ColumnSelectProps) => (
    <select value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
        <option value="">Select column</option>
        {columns.map(column => (
            <option key={column.key} value={column.key}>
                {column.displayName}
            </option>
        ))}
    </select>
);

type ParameterSelectProps = {
    parameters: ActionParameterDraft[];
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
};

const ParameterSelect = ({ parameters, value, disabled, onChange }: ParameterSelectProps) => (
    <select value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
        <option value="">Select parameter</option>
        {parameters
            .filter(parameter => parameter.key.trim())
            .map(parameter => (
                <option key={parameter.id} value={parameter.key.trim()}>
                    {parameter.label.trim() || parameter.key.trim()}
                </option>
            ))}
    </select>
);

type RunFormProps = {
    action: Action | undefined;
    runValues: Record<string, string>;
    disabled: boolean;
    lastRunMessage: string;
    onRunValueChange: (key: string, value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const RunForm = ({
    action,
    runValues,
    disabled,
    lastRunMessage,
    onRunValueChange,
    onSubmit,
}: RunFormProps) => {
    if (!action) {
        return <p className={styles['placeholder']}>Save an action before running it.</p>;
    }

    return (
        <form className={styles['card']} onSubmit={onSubmit}>
            <div className={styles['card-header']}>
                <div>
                    <h3 className={styles['section-title']}>Run action</h3>
                    <p>Enter parameters and execute this business operation.</p>
                </div>
                <Button type="submit" disabled={disabled}>
                    <Play size={18} />
                    Run
                </Button>
            </div>

            {action.parameters.length === 0 ? (
                <div className={styles['status']}>This action has no parameters.</div>
            ) : (
                <div className={styles['run-grid']}>
                    {action.parameters.map(parameter => (
                        <label key={parameter.key} className={styles['control']}>
                            <span>{parameter.label}</span>
                            {parameter.type === 'bool' ? (
                                <select
                                    value={runValues[parameter.key] ?? ''}
                                    disabled={disabled}
                                    onChange={event =>
                                        onRunValueChange(parameter.key, event.target.value)
                                    }
                                >
                                    <option value="">Empty</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                </select>
                            ) : (
                                <input
                                    type={parameter.type === 'number' ? 'number' : parameter.type === 'date' ? 'date' : 'text'}
                                    value={runValues[parameter.key] ?? ''}
                                    disabled={disabled}
                                    required={parameter.required}
                                    onChange={event =>
                                        onRunValueChange(parameter.key, event.target.value)
                                    }
                                />
                            )}
                        </label>
                    ))}
                </div>
            )}

            {lastRunMessage && (
                <div className={`${styles['status']} ${styles['success']}`}>{lastRunMessage}</div>
            )}
        </form>
    );
};
