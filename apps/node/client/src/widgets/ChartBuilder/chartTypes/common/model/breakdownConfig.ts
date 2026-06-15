/**
 * flat draft shape used by breakdown settings
 */
export type BreakdownDraft = {
    enabled: boolean;
    columnId: string;
    topN: number;
    otherBucket: boolean;
};
