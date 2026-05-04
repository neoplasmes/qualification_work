import { createApp } from '@/adapters/createApp';

import { createPool } from '@/infrastructure/postgres';

const pool = await createPool();

const app = createApp(pool);

const port = Number(process.env.SERVER_PORT ?? 3001);
if (!Number.isInteger(port) || port <= 0) {
    throw new Error('SERVER_PORT env переменная задана некорректно');
}

app.listen({ port, host: '0.0.0.0' }).then(() => {
    console.log(`server runs on port ${port}`);
});
