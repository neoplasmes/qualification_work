import { Agent } from '../lib/agent.ts';
import type { CanonicalEvent, HookDecision, HookEvent } from '../lib/hook.ts';
import { readRecord, readString, type JsonRecord } from '../lib/json.ts';

// adapter only, not registered in .cursor/hooks.json
export class CursorAgent extends Agent {
    protected readonly events: Record<string, CanonicalEvent> = {
        preToolUse: 'on-edit',
        postToolUse: 'on-edited',
        stop: 'on-stop',
        sessionStart: 'on-start',
    };

    protected readonly tools: Record<string, string> = {
        Edit: 'edit',
        Write: 'edit',
        edit_file: 'edit',
    };

    respond(event: HookEvent, decision: HookDecision | undefined): string {
        if (decision === undefined) {
            return '{}';
        }

        if (event.event === 'on-stop') {
            return JSON.stringify({ followup_message: decision.reason });
        }

        return JSON.stringify({
            permission: 'deny',
            user_message: decision.reason,
            agent_message: decision.reason,
        });
    }

    protected files(payload: JsonRecord): string[] {
        const file =
            readString(payload, 'file_path') ??
            readString(readRecord(payload, 'tool_input') ?? {}, 'file_path');

        return file === undefined ? [] : [file];
    }

    protected override cwd(payload: JsonRecord): string | undefined {
        const roots = payload.workspace_roots;

        return Array.isArray(roots) && typeof roots[0] === 'string'
            ? roots[0]
            : readString(payload, 'cwd');
    }

    protected override sessionId(payload: JsonRecord): string | undefined {
        return readString(payload, 'conversation_id');
    }

    protected override stopHookActive(payload: JsonRecord): boolean {
        return typeof payload.loop_count === 'number' && payload.loop_count > 0;
    }
}
