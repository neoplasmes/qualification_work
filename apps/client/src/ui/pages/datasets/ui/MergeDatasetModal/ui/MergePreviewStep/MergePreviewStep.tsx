import { Button, Notice, Text } from '@qualification-work/design-system';
import { ArrowLeft, Check, Rows3 } from 'lucide-react';

import type { MergePreviewResult } from '@/app/ports/repos/upload';

import { datasetsTestIds } from '../../../../const';

import styles from './mergePreviewStep.module.css';

type MergePreviewStepProps = {
    mode: 'append' | 'merge';
    previewResult: MergePreviewResult;
    error: string;
    committing: boolean;
    blocked: boolean;
    backDisabled: boolean;
    onBack: () => void;
    onConfirm: () => void;
};

export const MergePreviewStep = ({
    mode,
    previewResult,
    error,
    committing,
    blocked,
    backDisabled,
    onBack,
    onConfirm,
}: MergePreviewStepProps) => {
    const hasConflicts = previewResult.conflicts.length > 0;

    return (
        <div className={styles['content']} data-stack="v" data-gap="md">
            <dl className={styles['merge-stats']}>
                <div className={styles['merge-stat']}>
                    <dt>
                        <Text variant="label">
                            {mode === 'append' ? 'Строки для добавления' : 'Новые строки'}
                        </Text>
                    </dt>
                    <dd>
                        <Text variant="heading">
                            {previewResult.statistics.totalNewRows}
                        </Text>
                    </dd>
                </div>
                {mode === 'append' ? (
                    <div className={styles['merge-stat']}>
                        <dt>
                            <Text variant="label">Входящие строки</Text>
                        </dt>
                        <dd>
                            <Text variant="heading">
                                {previewResult.statistics.totalIncomingRows}
                            </Text>
                        </dd>
                    </div>
                ) : (
                    <div className={styles['merge-stat']}>
                        <dt>
                            <Text variant="label">Совпавшие строки</Text>
                        </dt>
                        <dd>
                            <Text variant="heading">
                                {previewResult.statistics.totalDuplicateRows}
                            </Text>
                        </dd>
                    </div>
                )}
                {previewResult.statistics.copiedRows > 0 && (
                    <div className={styles['merge-stat']}>
                        <dt>
                            <Text variant="label">Скопированные строки</Text>
                        </dt>
                        <dd>
                            <Text variant="heading">
                                {previewResult.statistics.copiedRows}
                            </Text>
                        </dd>
                    </div>
                )}
            </dl>

            {previewResult.statistics.newColumns.length > 0 && (
                <div data-stack="v" data-gap="xs">
                    <span className={styles['section-title']}>Новые поля</span>
                    <div className={styles['columns-list']}>
                        {previewResult.statistics.newColumns.map(column => (
                            <div key={column.key} className={styles['column-chip']}>
                                <span>{column.displayName ?? column.key}</span>
                                <small>{column.dataType}</small>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasConflicts && (
                <div
                    className={styles['merge-conflicts-wrap']}
                    role="region"
                    aria-label="Конфликты данных"
                    tabIndex={0}
                >
                    <span className={styles['merge-conflicts-title']}>
                        Конфликты ({previewResult.conflicts.length}): подтверждение
                        недоступно
                    </span>
                    <table className={styles['merge-conflicts-table']}>
                        <thead>
                            <tr>
                                <th>Поле</th>
                                <th>Было</th>
                                <th>Стало</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewResult.conflicts.map((conflict, index) => (
                                <tr key={`${conflict.column}-${index}`}>
                                    <td>{conflict.column}</td>
                                    <td>{String(conflict.oldValue ?? '')}</td>
                                    <td>{String(conflict.newValue ?? '')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {error && (
                <Notice tone="danger" role="alert">
                    {error}
                </Notice>
            )}

            <div className={styles['modal-actions']}>
                <Button variant="ghost" disabled={backDisabled} onClick={onBack}>
                    <ArrowLeft size={18} />
                    Назад
                </Button>
                <Button
                    data-test-id={datasetsTestIds.mergeConfirmButton}
                    disabled={hasConflicts || committing || blocked}
                    aria-busy={committing}
                    onClick={onConfirm}
                >
                    {mode === 'append' ? <Rows3 size={18} /> : <Check size={18} />}
                    Подтвердить
                </Button>
            </div>
        </div>
    );
};
