import { Router } from 'primitive-server';

import type { LoginHandler, LogoutHandler, RegisterHandler } from '@/core/commands';
import type { MeCacheRepository, SessionRepository } from '@/core/ports';
import type { MeHandler } from '@/core/queries';

import type { AppState } from '@/common/appState';

import { createLoginHandler } from './login';
import { createLogoutHandler } from './logout/logout';
import { createMeHandler } from './me';
import { createRegisterHandler } from './register';

export function createAuthRouter(
    register: RegisterHandler,
    login: LoginHandler,
    logout: LogoutHandler,
    me: MeHandler,
    meCacheRepository: MeCacheRepository,
    sessionRepo: SessionRepository
): Router<AppState> {
    const router = new Router<AppState>('/auth');

    router.post('/register', createRegisterHandler(register));
    router.post('/login', createLoginHandler(login));
    router.post('/logout', createLogoutHandler(logout));
    router.get('/me', createMeHandler(me, meCacheRepository, sessionRepo));

    return router;
}
