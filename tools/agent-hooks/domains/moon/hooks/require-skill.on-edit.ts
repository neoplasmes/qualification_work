import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { block, type HookDecision } from '../../../lib/hook.ts';

/**
 * blocks the first moon config edit per session until the agent was pointed at the moon skill
 *
 * @param root
 * @param sessionId
 * @returns
 */
export const requireSkill = async (
    root: string,
    sessionId: string
): Promise<HookDecision | undefined> => {
    // the marker records the reminder, not proof of reading
    const markerDir = path.join(root, '.local', 'agent-hooks', 'moon-skill');
    const marker = path.join(markerDir, sessionId.replace(/[^\w-]/g, '_'));

    if (existsSync(marker)) {
        return undefined;
    }

    mkdirSync(markerDir, { recursive: true });
    writeFileSync(marker, '');

    return block(
        'read .agents/skills/moonrepo/SKILL.md before editing moon configuration, then retry the edit'
    );
};
