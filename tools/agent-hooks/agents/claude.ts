import { Agent } from '../lib/agent.ts';
import type { CanonicalEvent, HookDecision, HookEvent } from '../lib/hook.ts';
import { readRecord, readString, type JsonRecord } from '../lib/json.ts';

export class ClaudeAgent extends Agent {
    protected readonly events: Record<string, CanonicalEvent> = {
        PreToolUse: 'on-edit',
        PostToolUse: 'on-edited',
        Stop: 'on-stop',
        SessionStart: 'on-start',
    };

    protected readonly tools: Record<string, string> = {
        Edit: 'edit',
        MultiEdit: 'edit',
        Write: 'edit',
    };

    respond(event: HookEvent, decision: HookDecision | undefined): string {
        if (decision === undefined) {
            return '';
        }

        if (event.event === 'on-edit') {
            return JSON.stringify({
                hookSpecificOutput: {
                    hookEventName: 'PreToolUse',
                    permissionDecision: 'deny',
                    permissionDecisionReason: decision.reason,
                },
            });
        }

        return JSON.stringify({ decision: 'block', reason: decision.reason });
    }

    protected files(payload: JsonRecord): string[] {
        const file = readString(readRecord(payload, 'tool_input') ?? {}, 'file_path');

        return file === undefined ? [] : [file];
    }
}
