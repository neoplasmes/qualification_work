import type { HookDecision, HookEvent } from '../../lib/hook.ts';
import { checkWorkspace } from './hooks/check-workspace.on-stop.ts';
import { requireSkill } from './hooks/require-skill.on-edit.ts';
import { validateConfig } from './hooks/validate-config.on-edited.ts';

// moon configuration: workspace, shared tasks, project configs, proto pins
const moonConfig = /(^|\/)(\.moon\/.+\.ya?ml|moon\.ya?ml|\.prototools)$/;

/**
 * routes canonical events to moon hooks, stopping on the first block
 *
 * @param event
 * @returns
 */
export const moonRouter = async (event: HookEvent): Promise<HookDecision | undefined> => {
    if (event.event === 'on-stop') {
        return event.stopHookActive ? undefined : checkWorkspace(event.root);
    }

    if (event.tool !== 'edit') {
        return undefined;
    }

    const configs = event.files.filter(file => moonConfig.test(file));

    if (configs.length === 0) {
        return undefined;
    }

    if (event.event === 'on-edit') {
        return requireSkill(event.root, event.sessionId);
    }

    return event.event === 'on-edited' ? validateConfig(event.root) : undefined;
};
