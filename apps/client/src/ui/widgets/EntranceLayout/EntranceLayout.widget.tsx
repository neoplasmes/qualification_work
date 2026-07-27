import { HStack, Link, Sheet } from '@qualification-work/design-system';
import { NavLink, Outlet } from 'react-router';

import { Banner } from './ui/Banner';

import styles from './entranceLayout.widget.module.css';

export function Entrance() {
    return (
        <main className={styles.entrance}>
            <Banner />
            <Sheet className={styles.document} border="ink">
                <HStack
                    as="nav"
                    gap={24}
                    className={styles.navigation}
                    aria-label="Вход и регистрация"
                >
                    <Link as={NavLink} to="/sign-in">
                        Вход
                    </Link>
                    <Link as={NavLink} to="/sign-up">
                        Регистрация
                    </Link>
                </HStack>
                <Outlet />
            </Sheet>
        </main>
    );
}
