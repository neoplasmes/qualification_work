import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { pool } from './database';

const setCors = (res: ServerResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const json = (res: ServerResponse, data: unknown, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    setCors(res);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = req.url;

    if (req.method === 'GET' && url === '/') {
        json(res, { hello: 'world' });
        return;
    }

    if (req.method === 'GET' && url === '/health') {
        json(res, { status: 'ok' });
        return;
    }

    if (req.method === 'GET' && url === '/dbcheck') {
        const { rows } = await pool.query('SELECT * FROM posts');
        json(res, rows);
        return;
    }

    json(res, { error: 'Not Found' }, 404);
});

server.listen(4000, '0.0.0.0', () => {
    console.log('server runs on port 4000');
});
