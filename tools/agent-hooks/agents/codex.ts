import { readRecord, type JsonRecord } from '../lib/json.ts';
import { ClaudeAgent } from './claude.ts';

// apply_patch file headers: `*** Add File: path`, `*** Update File: path`, `*** Delete File: path`
const patchFile = /^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm;

export class CodexAgent extends ClaudeAgent {
    protected override readonly tools: Record<string, string> = { apply_patch: 'edit' };

    protected override files(payload: JsonRecord): string[] {
        const input = payload.tool_input;
        const sources =
            typeof input === 'string'
                ? [input]
                : Object.values(readRecord(payload, 'tool_input') ?? {});
        const files: string[] = [];

        for (const source of sources) {
            if (typeof source === 'string') {
                for (const match of source.matchAll(patchFile)) {
                    files.push(match[1].trim());
                }
            }
        }

        return files;
    }
}
