import type { ActionRun } from '@/core/entities/actionRun';
import { Sheet, Stamp, Text, ValueDiff, VStack } from '@qualification-work/design-system';

import styles from './actionRunDetails.module.css';

export function ActionRunDetails({ run }: { run: ActionRun }) {
    return (
        <Sheet
            as="section"
            border="dashed"
            className={styles.document}
            aria-label="Изменения выполнения"
        >
            <VStack gap={20}>
                <Text as="h3" variant="heading-sm">
                    Результат выполнения
                </Text>
                <Stamp variant={run.status === 'success' ? 'done' : 'void'}>
                    {run.status === 'success' ? 'Выполнено' : 'Ошибка'}
                </Stamp>
                {run.errorMessage && <Text tone="danger">{run.errorMessage}</Text>}
                {run.changes.length === 0 && (
                    <Text tone="muted">Изменения не записаны.</Text>
                )}
                {run.changes.map((change, index) => (
                    <VStack key={`${index}/${change.datasetId}`} gap={12}>
                        <Text variant="label">
                            {change.kind === 'insertRow'
                                ? 'Добавлена строка'
                                : 'Изменены строки'}
                        </Text>
                        {change.kind === 'insertRow' ? (
                            <pre className={styles.snapshot}>
                                {JSON.stringify(change.data, null, 2)}
                            </pre>
                        ) : (
                            change.after.map(row => (
                                <VStack key={row.rowId} gap={8}>
                                    {Object.entries(row.data).map(([key, value]) => (
                                        <VStack key={key} gap={4}>
                                            <Text variant="data">{key}</Text>
                                            <ValueDiff
                                                before={
                                                    JSON.stringify(
                                                        change.before.find(
                                                            before =>
                                                                before.rowId === row.rowId
                                                        )?.data[key]
                                                    ) ?? '∅'
                                                }
                                                after={JSON.stringify(value) ?? '∅'}
                                                changeLabel={`Изменение ${key}`}
                                            />
                                        </VStack>
                                    ))}
                                </VStack>
                            ))
                        )}
                    </VStack>
                ))}
            </VStack>
        </Sheet>
    );
}
