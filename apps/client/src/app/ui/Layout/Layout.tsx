import { LazyMotion } from 'motion/react';
import { Outlet, useLocation } from 'react-router';

import { usePersistedStateHydration } from '../../model';
import { NavBar } from '../NavBar';

const motionFeatures = () => import('../../config').then(res => res.domMax);

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
            <div
                data-stack="v"
                data-gap="xs"
                data-px="sm"
                data-py="xs"
                style={{ height: '100vh', overflow: 'hidden' }}
            >
                <NavBar />
                <Outlet />
            </div>
        </LazyMotion>
    );
};
