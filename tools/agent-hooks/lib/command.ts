import { spawn } from 'node:child_process';

// tail kept from command output so provider responses stay small
const outputLimit = 4000;

export type CommandResult = {
    // null when the executable is missing
    code: number | null;
    output: string;
};

/**
 * runs an external command and captures the bounded tail of stdout and stderr
 *
 * @param executable
 * @param args
 * @param cwd
 * @returns
 */
export const runCommand = (
    executable: string,
    args: string[],
    cwd: string
): Promise<CommandResult> =>
    new Promise(resolve => {
        const child = spawn(executable, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
        let output = '';

        const collect = (chunk: Buffer) => {
            output = (output + chunk.toString()).slice(-outputLimit);
        };

        child.stdout.on('data', collect);
        child.stderr.on('data', collect);
        child.on('error', () => resolve({ code: null, output }));
        child.on('close', code => resolve({ code: code ?? 1, output }));
    });
