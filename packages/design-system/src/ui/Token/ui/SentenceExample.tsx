import { useState } from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { HStack } from '../../HStack';
import { Text } from '../../Text';
import { Token } from '../index';
import styles from './sentenceExample.module.css';

const metrics = ['Выручка', 'Прибыль', 'Количество заказов'];

export function SentenceExample() {
    const [metric, setMetric] = useState('Выручка');

    return <HStack gap={12} wrap className={styles.sentence}>
        <Text variant="heading-sm">Показать</Text>
        <BaseMenu.Root>
            <BaseMenu.Trigger render={<Token aria-label={`Показатель: ${metric}`} />}>{metric}</BaseMenu.Trigger>
            <BaseMenu.Portal>
                <BaseMenu.Positioner sideOffset={8} align="start" className={styles.positioner}>
                    <BaseMenu.Popup data-theme="paper" className={styles.popup}>
                        <BaseMenu.RadioGroup aria-label="Показатель" value={metric} onValueChange={setMetric}>
                            {metrics.map((item) => <BaseMenu.RadioItem key={item} value={item} closeOnClick className={styles.item}><Text variant="typed">{item}</Text></BaseMenu.RadioItem>)}
                        </BaseMenu.RadioGroup>
                    </BaseMenu.Popup>
                </BaseMenu.Positioner>
            </BaseMenu.Portal>
        </BaseMenu.Root>
        <Text variant="heading-sm">за текущий месяц</Text>
    </HStack>;
}
