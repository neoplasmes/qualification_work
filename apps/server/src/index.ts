import Fastify from 'fastify';
import { sql } from 'drizzle-orm';

import { database } from './database';

const fastify = Fastify({
    logger: true,
});

fastify.get('/', async function handler(request, reply) {
    return { hello: 'world' };
});

fastify.get('/dbcheck', async function handler(request, reply) {
    const testData = await database.execute(sql`SELECT * FROM posts`);

    return testData;
});

// Run the server!
const start = async () => {
    try {
        await fastify.listen({ port: 4000 });
        console.log('server runs');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
