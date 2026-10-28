import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

const gateway = path.join(import.meta.dirname, 'gateway.ts');

let repo: string;

const run = (provider: string, payload: unknown) =>
    spawnSync(process.execPath, [gateway, provider], {
        input: JSON.stringify(payload),
        encoding: 'utf8',
    });

beforeEach(() => {
    repo = mkdtempSync(path.join(tmpdir(), 'agent-hooks-'));
    execFileSync('git', ['init', '-q'], { cwd: repo });
});

describe('gateway', () => {
    it('ignores unknown providers and malformed payloads', () => {
        expect(run('nobody', { hook_event_name: 'PreToolUse' }).stdout).toBe('');
        expect(
            spawnSync(process.execPath, [gateway, 'claude'], {
                input: '{',
                encoding: 'utf8',
            }).stdout
        ).toBe('');
    });

    it('reminds claude about the moon skill once per session', () => {
        const payload = {
            hook_event_name: 'PreToolUse',
            tool_name: 'Edit',
            tool_input: { file_path: 'apps/x/moon.yaml' },
            cwd: repo,
            session_id: 's1',
        };

        const first = JSON.parse(run('claude', payload).stdout);
        expect(first.hookSpecificOutput.permissionDecision).toBe('deny');
        expect(run('claude', payload).stdout).toBe('');
    });

    it('skips edits outside moon configs', () => {
        const payload = {
            hook_event_name: 'PreToolUse',
            tool_name: 'Edit',
            tool_input: { file_path: 'src/a.ts' },
            cwd: repo,
            session_id: 's2',
        };

        expect(run('claude', payload).stdout).toBe('');
    });

    it('reads codex patch headers', () => {
        const payload = {
            hook_event_name: 'PreToolUse',
            tool_name: 'apply_patch',
            tool_input: {
                command: '*** Begin Patch\n*** Update File: .moon/workspace.yaml\n',
            },
            cwd: repo,
            session_id: 's3',
        };

        expect(
            JSON.parse(run('codex', payload).stdout).hookSpecificOutput.permissionDecision
        ).toBe('deny');
    });

    it('answers cursor with its own contract', () => {
        const payload = {
            hook_event_name: 'preToolUse',
            tool_name: 'Write',
            file_path: 'moon.yaml',
            workspace_roots: [repo],
            conversation_id: 's4',
        };

        expect(JSON.parse(run('cursor', payload).stdout).permission).toBe('deny');
    });

    it('skips recursive stops', () => {
        expect(
            run('claude', { hook_event_name: 'Stop', cwd: repo, stop_hook_active: true })
                .stdout
        ).toBe('');
    });

    it('produces no work outside git', () => {
        const payload = {
            hook_event_name: 'PreToolUse',
            tool_name: 'Edit',
            tool_input: { file_path: 'moon.yaml' },
            cwd: tmpdir(),
            session_id: 's5',
        };

        expect(run('claude', payload).stdout).toBe('');
    });
});
