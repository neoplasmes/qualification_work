import { Text, VStack } from '@qualification-work/design-system';

import styles from './banner.module.css';

export function Banner() {
    return (
        <aside className={styles.banner}>
            <VStack gap={24}>
                <Text variant="heading-sm">BI Tool</Text>
                <Text variant="display">
                    Рабочая тетрадь
                    <br />
                    вашей организации
                </Text>
                <Text variant="body" tone="mutedCanvas">
                    Собирайте таблицы, исследуйте данные на графиках и выполняйте действия
                    в одном рабочем пространстве.
                </Text>
            </VStack>
        </aside>
    );
}
