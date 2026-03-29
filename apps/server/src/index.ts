import { Application } from 'primitive-server';

import { RegisterHandler } from '@/core/commands';
import { AppError, ValidationError } from '@/core/errors';
import { createAuthRouter } from '@/implementation/http';
import { createPool, PgUserRepository } from '@/implementation/repository';
import { Argon2Hasher } from '@/implementation/services';

const pepper = process.env.PEPPER;
if (!pepper) {
    throw new Error('PEPPER env переменная не задана');
}

const pool = await createPool();

const userRepo = new PgUserRepository(pool);
const hasher = new Argon2Hasher(pepper);

const registerHandler = new RegisterHandler(userRepo, hasher);

// --- http ---

const app = new Application();

// централизованная обработка ошибок
app.onError((err, { response }) => {
    if (response.sent) {
        return;
    }

    if (err instanceof ValidationError) {
        response.status(err.statusCode).json({
            error: err.message,
            details: err.details,
        });
        return;
    }

    if (err instanceof AppError) {
        response.status(err.statusCode).json({ error: err.message });
        return;
    }

    console.error(err);
    response.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// CORS
app.onRequest(({ response }) => {
    response.head({
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'access-control-allow-headers': 'Content-Type',
    });
});

// роуты без префикса
app.get('/', ({ response }) => {
    response.json({ hello: 'world' });
});

app.get('/health', ({ response }) => {
    response.json({ status: 'ok' });
});

// auth
const authRouter = createAuthRouter(registerHandler);
app.mount('/api', authRouter);

app.listen({ port: 4000, host: '0.0.0.0' }).then(() => {
    console.log('server runs on port 4000');
});
