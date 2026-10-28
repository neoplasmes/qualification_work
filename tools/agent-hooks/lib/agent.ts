import { execFileSync } from 'node:child_process';
import path from 'node:path';

import type { CanonicalEvent, HookDecision, HookEvent } from './hook.ts';
import { isRecord, readString, type JsonRecord } from './json.ts';

/**
 * translates one provider's native hook payloads into canonical events and back
 */
export abstract class Agent {
    // native event name -> canonical event
    protected abstract readonly events: Record<string, CanonicalEvent>;

    // native tool name -> canonical tool
    protected abstract readonly tools: Record<string, string>;

    /**
     * produces a canonical event or undefined when there is no work
     *
     * @param payload
     * @returns
     */
    parse(payload: unknown): HookEvent | undefined {
        if (!isRecord(payload)) {
            return undefined;
        }

        const event = this.events[this.eventName(payload) ?? ''];
        const cwd = this.cwd(payload);

        if (event === undefined || cwd === undefined) {
            return undefined;
        }

        let root: string;

        try {
            root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
                cwd,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            }).trim();
        } catch {
            return undefined;
        }

        const files = new Set<string>();

        for (const file of this.files(payload)) {
            const relative = path
                .relative(root, path.resolve(cwd, file))
                .split(path.sep)
                .join('/');

            if (relative !== '' && !relative.startsWith('../')) {
                files.add(relative);
            }
        }

        const nativeTool = this.toolName(payload);

        return {
            event,
            tool: nativeTool === undefined ? '' : (this.tools[nativeTool] ?? nativeTool),
            files: [...files],
            cwd,
            root,
            sessionId: this.sessionId(payload) ?? 'unknown',
            stopHookActive: this.stopHookActive(payload),
        };
    }

    /**
     * serializes a decision into the provider's stdout contract, empty when nothing to say
     *
     * @param event
     * @param decision
     * @returns
     */
    abstract respond(event: HookEvent, decision: HookDecision | undefined): string;

    protected eventName(payload: JsonRecord): string | undefined {
        return readString(payload, 'hook_event_name');
    }

    protected toolName(payload: JsonRecord): string | undefined {
        return readString(payload, 'tool_name');
    }

    protected abstract files(payload: JsonRecord): string[];

    protected cwd(payload: JsonRecord): string | undefined {
        return readString(payload, 'cwd');
    }

    protected sessionId(payload: JsonRecord): string | undefined {
        return readString(payload, 'session_id');
    }

    protected stopHookActive(payload: JsonRecord): boolean {
        return payload.stop_hook_active === true;
    }
}
