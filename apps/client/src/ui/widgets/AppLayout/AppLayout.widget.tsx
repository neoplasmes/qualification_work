import { NavBar } from '@/ui/widgets/NavBar';
import { LazyMotion } from 'motion/react';
import { Outlet, useLocation } from 'react-router';

import { usePersistedStateHydration } from './model';

import styles from './appLayout.widget.module.css';

const motionFeatures = () => import('./model/motionFeatures').then(res => res.domMax);

export const Layout = () => {
    const location = useLocation();
    const isAuthPage =
        location.pathname === '/sign-in' || location.pathname === '/sign-up';
    usePersistedStateHydration(!isAuthPage);

    if (isAuthPage) {
        return (
            <LazyMotion features={motionFeatures} strict>
                <Outlet />
            </LazyMotion>
        );
    }

    // TODO: Layout для основной части приложения
    return (
        <LazyMotion features={motionFeatures} strict>
            <div className={styles.shell}>
                <NavBar />
                <Outlet />
            </div>
        </LazyMotion>
    );
};
