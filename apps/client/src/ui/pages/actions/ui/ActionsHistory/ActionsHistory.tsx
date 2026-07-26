import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useActiveOrganization, useSession } from '@/ui/session';
import {
    Button,
    HStack,
    Notice,
    Stamp,
    Text,
    VStack,
} from '@qualification-work/design-system';
import { useState } from 'react';

import { formatDate } from '@/shared/lib/formatDate';

import { ActionRunDetails } from '../ActionRunDetails';

import styles from './actionsHistory.module.css';

export const ActionsHistory = ({
    actionNamesById,
}: {
    actionNamesById: Map<string, string>;
}) => {
    const session = useSession();
    const { activeOrg: org } = useActiveOrganization(session.data);
    const dependencies = useDependencies();
    const [offset, setOffset] = useState(0);
    const [selectedId, setSelectedId] = useState<string>();
    const [retryError, setRetryError] = useState(false);
    const input = { kind: 'org' as const, orgId: org?.id ?? '', offset, limit: 50 };
    const runsQuery = useRead(dependencies.listActionRuns, input, {
        enabled: Boolean(org),
    });
    const selected = runsQuery.data?.find(run => run.id === selectedId);

    return (
        <VStack as="section" gap={20} aria-label="Журнал действий">
            <Text as="h2" variant="heading-sm">
                Журнал действий
            </Text>
            {runsQuery.isPending && !runsQuery.error && (
                <Text role="status">Загрузка журнала…</Text>
            )}
            {(Boolean(runsQuery.error) || retryError) && (
                <Notice tone="danger" role="alert">
                    Не удалось загрузить журнал.
                </Notice>
            )}
            <Button
                variant="ghost"
                disabled={runsQuery.isFetching || !org}
                onClick={async () => {
                    try {
                        setRetryError(false);
                        await dependencies.cache.read(dependencies.listActionRuns, input);
                    } catch {
                        setRetryError(true);
                    }
                }}
            >
                Обновить журнал
            </Button>
            {runsQuery.data?.length === 0 && (
                <Text tone="muted">Выполнений пока нет.</Text>
            )}
            {runsQuery.data?.map(run => (
                <button
                    type="button"
                    key={run.id}
                    className={styles.entry}
                    aria-pressed={selectedId === run.id}
                    onClick={() => setSelectedId(run.id)}
                >
                    <Text as="span" variant="body-sm">
                        {actionNamesById.get(run.actionId) ?? 'Удалённое действие'}
                    </Text>
                    <Text as="span" variant="data">
                        {formatDate(run.executedAt)}
                    </Text>
                    <Stamp variant={run.status === 'success' ? 'done' : 'void'}>
                        {run.status === 'success' ? 'Выполнено' : 'Ошибка'}
                    </Stamp>
                    <Text as="span" variant="body-sm">
                        {run.errorMessage ?? `Изменений: ${run.changes.length}`}
                    </Text>
                </button>
            ))}
            <HStack gap={8} wrap>
                <Button
                    variant="ghost"
                    disabled={offset === 0 || runsQuery.isFetching}
                    onClick={() => {
                        setOffset(value => Math.max(0, value - 50));
                        setSelectedId(undefined);
                    }}
                >
                    Назад
                </Button>
                <Text variant="data">Страница {offset / 50 + 1}</Text>
                <Button
                    variant="ghost"
                    disabled={runsQuery.isFetching || runsQuery.data?.length !== 50}
                    onClick={() => {
                        setOffset(value => value + 50);
                        setSelectedId(undefined);
                    }}
                >
                    Далее
                </Button>
            </HStack>
            {selected && <ActionRunDetails run={selected} />}
        </VStack>
    );
};
