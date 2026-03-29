import { Router } from 'primitive-server';

import type { RegisterHandler } from '@/core/commands';

import { createRegisterHandler } from './register';

export function createAuthRouter(register: RegisterHandler): Router {
    const router = new Router('/auth');

    router.post('/register', createRegisterHandler(register));

    return router;
}
