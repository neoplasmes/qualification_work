import type { Entity } from '../entity';

export type ActionRunChange =
    | {
          kind: 'insertRow';
          datasetId: string;
          rowId: string;
          rowIndex: number;
          data: Record<string, unknown>;
      }
    | {
          kind: 'updateRowsByMatch';
          datasetId: string;
          match: {
              columnKey: string;
              value: unknown;
          };
          rowIds: string[];
          before: Array<{
              rowId: string;
              rowIndex: number;
              data: Record<string, unknown>;
          }>;
          after: Array<{
              rowId: string;
              rowIndex: number;
              data: Record<string, unknown>;
          }>;
      };

export interface ActionRun extends Entity {
    readonly ref: `actionRun:${string}`;
    id: string;
    actionId: string;
    orgId: string;
    userId: string;
    parameters: Record<string, unknown>;
    changes: ActionRunChange[];
    status: 'success' | 'failed';
    errorMessage: string | null;
    executedAt: string;
}
