import { useState } from 'react';
import { Button, Field, HStack, Input, Link, Marker, NumberField, Choice, Sheet, Text, ValueDiff, VStack } from '@qualification-work/design-system';
import styles from './phoneReference.module.css';

const channelOptions = [{ value: 'shop', label: 'Магазин' }, { value: 'avito', label: 'Авито' }, { value: 'site', label: 'Сайт' }];

export function PhoneReference() {
    const [quantity, setQuantity] = useState<number | null>(2);

    return <VStack className={styles.phone}>
        <VStack gap={4} className={styles.header}>
            <Link href="#actions" variant="quiet" block className={styles.back}>Все действия</Link>
            <Text as="h1" variant="heading">Продать стул Рига</Text>
        </VStack>
        <VStack gap={20} className={styles.body}>
            <Field label="Номер заказа"><Input defaultValue="З-1042" readOnly /></Field>
            <Field label="Количество" description="На складе 14 шт.">
                <NumberField value={quantity} onValueChange={setQuantity} min={1} max={14} size="large" decrementLabel="Меньше" incrementLabel="Больше" />
            </Field>
            <Field label="Канал"><Choice options={channelOptions} defaultValue="shop" size="large" fullWidth /></Field>
            <Sheet variant="raised" border="dashed" className={styles.preview}>
                <Text as="div" variant="label" tone="mutedCanvas" className={styles.previewLabel}>Что изменится</Text>
                <HStack justify="space-between" gap={12} className={styles.previewRow}>
                    <Text>Остаток на складе</Text><ValueDiff before={14} after={14 - (quantity ?? 0)} changeLabel="станет" />
                </HStack>
                <HStack justify="space-between" gap={12} className={styles.lastRow}>
                    <Text>Таблица «продажи»</Text><Marker className={styles.marker}>+1 строка</Marker>
                </HStack>
            </Sheet>
        </VStack>
        <VStack gap={8} className={styles.footer}>
            <Button size="large" fullWidth>Продать {quantity ?? 0} шт.</Button>
            <Text variant="body-sm" tone="muted" align="center">Можно отменить в журнале</Text>
        </VStack>
    </VStack>;
}
