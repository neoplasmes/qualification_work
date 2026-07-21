import { NavBar } from '@/ui/widgets/NavBar';
import { LazyMotion, MotionConfig } from 'motion/react';
import { Outlet, useLocation } from 'react-router';

import { usePersistedStateHydration } from './model';

import styles from './appLayout.widget.module.css';

const motionFeatures = () => import('./model/motionFeatures').then(res => res.domMax);

export const Layout = () => {
    const location = useLocation();
    const isAuthPage =
        location.pathname === '/sign-in' || location.pathname === '/sign-up';
    usePersistedStateHydration(!isAuthPage);

    let content = <Outlet />;

    // TODO: Layout для основной части приложения
    if (!isAuthPage) {
        content = (
            <div className={styles.shell}>
                <NavBar />
                <Outlet />
            </div>
        );
    }

    return (
        <MotionConfig reducedMotion="user">
            <LazyMotion features={motionFeatures} strict>
                {content}
            </LazyMotion>
        </MotionConfig>
    );
};
