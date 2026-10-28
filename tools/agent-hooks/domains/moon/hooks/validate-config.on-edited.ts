import { runCommand } from '../../../lib/command.ts';
import { block, type HookDecision } from '../../../lib/hook.ts';

/**
 * checks that moon still loads the workspace after a config edit
 *
 * @param root
 * @returns
 */
export const validateConfig = async (root: string): Promise<HookDecision | undefined> => {
    const result = await runCommand('moon', ['query', 'tasks'], root);

    // missing moon is skipped
    if (result.code === null || result.code === 0) {
        return undefined;
    }

    return block(`moon rejects the edited configuration:\n${result.output}`);
};
