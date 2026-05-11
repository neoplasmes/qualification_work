import { createApp } from '@/adapters/createApp';

import { loadConfig } from '@/infrastructure/config';
import { createPool } from '@/infrastructure/postgres';

const config = loadConfig();
const pool = await createPool(config.postgresConnectionString);

const app = createApp(pool, config);

app.listen({ port: config.port, host: '0.0.0.0' }).then(() => {
    console.log(`server runs on port ${config.port}`);
});
