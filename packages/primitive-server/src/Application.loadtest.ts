import autocannon from 'autocannon';
import { Application } from './Application';
const app = new Application();

app.get('/health', ctx => {
    ctx.response.text('ok');
});

app.get('/api/users', ctx => {
    ctx.response.json([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
    ]);
});

app.get('/api/users/:id', ctx => {
    ctx.response.json({ id: ctx.request.params.id, name: 'Alice' });
});

app.post('/api/posts', async ctx => {
    const body = await ctx.request.json();
    ctx.response.status(201).json({ created: true, data: body });
});

type Scenario = {
    title: string;
    opts: Partial<autocannon.Options>;
};

async function runScenario(scenario: Scenario): Promise<void> {
    console.log(`\n${scenario.title}`);

    const result = await autocannon({
        ...scenario.opts,
        duration: 15,
        connections: 100,
        pipelining: 10,
    } as autocannon.Options);

    console.log(autocannon.printResult(result));
}

async function main(): Promise<void> {
    const server = await app.listen({ port: 0 });
    const addr = server.address();

    if (!addr || typeof addr === 'string') {
        throw new Error('Не удалось получить адрес сервера');
    }

    const base = `http://127.0.0.1:${addr.port}`;
    console.log(`Сервер запущен на ${base}`);

    const scenarios: Scenario[] = [
        {
            title: 'static GET /health - text',
            opts: { url: `${base}/health` },
        },
        {
            title: 'JSON GET /api/users',
            opts: { url: `${base}/api/users` },
        },
        {
            title: 'parametric GET /api/users/:id',
            opts: { url: `${base}/api/users/42` },
        },
        {
            title: 'POST /api/posts - JSON body',
            opts: {
                url: `${base}/api/posts`,
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ title: 'Hello', content: 'World' }),
            },
        },
        {
            title: '404 Not Found',
            opts: { url: `${base}/nonexistent` },
        },
    ];

    for (const scenario of scenarios) {
        await runScenario(scenario);
    }

    await app.close();
    console.log('\nГотово');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
