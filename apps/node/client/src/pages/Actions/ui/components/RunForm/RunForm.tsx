import { Play } from 'lucide-react';
import type { FormEvent } from 'react';

import type { Action } from '@/entities/action';

import { Button } from '@/shared/ui';

import { actionsTestIds } from '../../../const';

import styles from './RunForm.module.scss';

type RunFormProps = {
    action: Action | undefined;
    runValues: Record<string, string>;
    disabled: boolean;
    lastRunMessage: string;
    onRunValueChange: (key: string, value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const RunForm = ({
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
        <form
            className={styles['card']}
            data-test-id={actionsTestIds.runForm}
            onSubmit={onSubmit}
        >
            <div className={styles['card-header']}>
                <div>
                    <h3 className={styles['section-title']}>Run action</h3>
                    <p>Enter parameters and execute this business operation.</p>
                </div>
                <Button
                    type="submit"
                    data-test-id={actionsTestIds.runButton}
                    disabled={disabled}
                >
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
                                    data-test-id={actionsTestIds.runBoolSelect}
                                    value={runValues[parameter.key] ?? ''}
                                    disabled={disabled}
                                    onChange={event =>
                                        onRunValueChange(
                                            parameter.key,
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">Empty</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                </select>
                            ) : (
                                <input
                                    data-test-id={actionsTestIds.runInput}
                                    type={
                                        parameter.type === 'number'
                                            ? 'number'
                                            : parameter.type === 'date'
                                              ? 'date'
                                              : 'text'
                                    }
                                    value={runValues[parameter.key] ?? ''}
                                    disabled={disabled}
                                    required={parameter.required}
                                    onChange={event =>
                                        onRunValueChange(
                                            parameter.key,
                                            event.target.value
                                        )
                                    }
                                />
                            )}
                        </label>
                    ))}
                </div>
            )}

            {lastRunMessage && (
                <div className={`${styles['status']} ${styles['success']}`}>
                    {lastRunMessage}
                </div>
            )}
        </form>
    );
};
