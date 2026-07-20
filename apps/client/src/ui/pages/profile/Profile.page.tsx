import { useSession } from '@/ui/session';
import { Notice, Sheet, Text, VStack } from '@qualification-work/design-system';

import styles from './profile.page.module.css';

export function ProfilePage() {
    const session = useSession();

    return (
        <main className={styles.page}>
            <Sheet border="ink" className={styles.document}>
                <VStack gap={24}>
                    <Text as="h1" variant="heading">
                        Профиль
                    </Text>
                    {session.isPending && <Text role="status">Загрузка профиля…</Text>}
                    {!!session.error && (
                        <Notice tone="danger" role="alert">
                            Не удалось загрузить профиль. Попробуйте обновить страницу.
                        </Notice>
                    )}
                    {session.data && (
                        <>
                            <VStack gap={4}>
                                <Text variant="label">Имя</Text>
                                <Text variant="typed">
                                    {session.data.user.name} {session.data.user.family}
                                </Text>
                            </VStack>
                            <VStack gap={4}>
                                <Text variant="label">Электронная почта</Text>
                                <Text variant="typed">{session.data.user.email}</Text>
                            </VStack>
                        </>
                    )}
                </VStack>
            </Sheet>
        </main>
    );
}
