import { runCommand } from '../../../lib/command.ts';
import { block, type HookDecision } from '../../../lib/hook.ts';

/**
 * runs the workspace checks before the agent stops with uncommitted changes
 *
 * @param root
 * @returns
 */
export const checkWorkspace = async (root: string): Promise<HookDecision | undefined> => {
    const status = await runCommand('git', ['status', '--porcelain'], root);

    if (status.code !== 0 || status.output.trim() === '') {
        return undefined;
    }

    const result = await runCommand('moon', ['run', ':check'], root);

    if (result.code === null || result.code === 0) {
        return undefined;
    }

    return block(`moon run :check failed, fix it before stopping:\n${result.output}`);
};
