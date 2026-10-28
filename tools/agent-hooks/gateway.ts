import { ClaudeAgent } from './agents/claude.ts';
import { CodexAgent } from './agents/codex.ts';
import { CursorAgent } from './agents/cursor.ts';
import { moonRouter } from './domains/moon/router.ts';
import type { Agent } from './lib/agent.ts';
import type { HookRouter } from './lib/hook.ts';

// claude and codex payloads are too similar to tell apart, so the provider comes as an argument
const agents: Record<string, Agent> = {
    claude: new ClaudeAgent(),
    codex: new CodexAgent(),
    cursor: new CursorAgent(),
};

const routers: HookRouter[] = [moonRouter];

const agent = agents[process.argv[2] ?? ''];

if (agent !== undefined) {
    const chunks: Buffer[] = [];

    for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
    }

    let payload: unknown;

    try {
        payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
        payload = undefined;
    }

    const event = agent.parse(payload);

    if (event !== undefined) {
        let decision;

        for (const router of routers) {
            decision = await router(event);

            if (decision !== undefined) {
                break;
            }
        }

        process.stdout.write(agent.respond(event, decision));
    }
}
