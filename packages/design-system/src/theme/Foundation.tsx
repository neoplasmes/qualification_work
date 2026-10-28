import { HStack, VStack, Text } from '../ui';
import { gaps, textVariants } from './tokens';
import styles from './foundation.module.css';

const palette = [
    'canvas',
    'paper',
    'paper-raised',
    'rule',
    'rule-dash',
    'ink',
    'ink-hover',
    'ink-2',
    'ink-3',
    'on-ink',
    'marker',
    'accent-orange',
    'olive',
    'night',
    'red-ink',
] as const;

export function Foundation() {
    return (
        <VStack gap={32}>
            <Text as="h1" variant="heading">
                BI Tool · Основы
            </Text>
            <VStack as="section" gap={16} aria-label="palette">
                <Text as="h2" variant="heading-sm">
                    Бумага и чернила
                </Text>
                <HStack gap={16} wrap align="start">
                    {palette.map(token => (
                        <VStack key={token} gap={8} className={styles.paletteItem}>
                            <div
                                className={styles.swatch}
                                style={{ backgroundColor: `var(--${token})` }}
                            />
                            <Text variant="label">{token}</Text>
                        </VStack>
                    ))}
                </HStack>
            </VStack>
            <VStack as="section" gap={16} aria-label="typography">
                <Text as="h2" variant="heading-sm">
                    Шрифты / Typography
                </Text>
                {textVariants.map(variant => (
                    <VStack key={variant} gap={4}>
                        <Text variant="label" tone="muted">
                            {variant}
                        </Text>
                        <Text variant={variant}>
                            Продажи · Paper and ink · 0123456789
                        </Text>
                    </VStack>
                ))}
            </VStack>
            <VStack as="section" gap={12} aria-label="spacing">
                <Text as="h2" variant="heading-sm">
                    Расстояния в пикселях
                </Text>
                {gaps.map(gap => (
                    <HStack key={gap} gap={16}>
                        <Text variant="typed" className={styles.spaceLabel}>
                            {gap}
                        </Text>
                        <div
                            className={styles.spaceBar}
                            style={{ width: `var(--space-${gap})` }}
                        />
                    </HStack>
                ))}
            </VStack>
            <HStack gap={16} wrap>
                <Text tone="muted">Подсказка на бумаге</Text>
                <Text tone="danger">Ошибка</Text>
                <Text as="a" href="#focus">
                    Keyboard focus / Фокус
                </Text>
            </HStack>
        </VStack>
    );
}
