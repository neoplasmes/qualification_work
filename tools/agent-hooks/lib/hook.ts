export type CanonicalEvent = 'on-edit' | 'on-edited' | 'on-stop' | 'on-start';

export type HookEvent = {
    event: CanonicalEvent;
    // canonical tool name, `edit` for every file editing tool
    tool: string;
    // workspace-relative, deduplicated, `/` separated
    files: string[];
    cwd: string;
    root: string;
    sessionId: string;
    stopHookActive: boolean;
};

export type HookDecision = { block: true; reason: string };

export type HookRouter = (event: HookEvent) => Promise<HookDecision | undefined>;

/**
 * builds a blocking decision
 *
 * @param reason
 * @returns
 */
export const block = (reason: string): HookDecision => ({ block: true, reason });
