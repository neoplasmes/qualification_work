import { Button, HStack, Text, Token } from '@qualification-work/design-system';
import { Plus } from 'lucide-react';

import { dashboardsTestIds } from '../../const';

import styles from './dashboardToolbar.module.css';

type DashboardToolbarProps = {
    title: string;
    onOpen: (modal: 'chart' | 'metric' | 'layout') => void;
};

export function DashboardToolbar({ title, onOpen }: DashboardToolbarProps) {
    return (
        <HStack
            justify="space-between"
            align="center"
            gap={12}
            wrap
            className={styles['toolbar']}
        >
            <Text as="h2" variant="heading" className={styles['title']}>
                {title}
            </Text>
            <HStack gap={8} wrap>
                <Button variant="ghost" onClick={() => onOpen('layout')}>
                    Расположение
                </Button>
                <Token
                    variant="add"
                    data-test-id={dashboardsTestIds.openAddMetricModalButton}
                    onClick={() => onOpen('metric')}
                >
                    <Plus size={16} />
                    Метрика
                </Token>
                <Token
                    variant="add"
                    data-test-id={dashboardsTestIds.openAddChartModalButton}
                    onClick={() => onOpen('chart')}
                >
                    <Plus size={16} />
                    График
                </Token>
            </HStack>
        </HStack>
    );
}
