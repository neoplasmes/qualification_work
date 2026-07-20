import { createContext, useContext } from 'react';

export const defaultResizerSize = 8;

export type WorkspaceGridConfig = {
    /**
     * width (row) / height (column) of the transparent resizer hit area in px
     */
    resizerSize: number;
};

export const WorkspaceGridContext = createContext<WorkspaceGridConfig>({
    resizerSize: defaultResizerSize,
});

/**
 * reads the grid config provided by the WorkspaceGrid root
 *
 * @returns
 */
export const useWorkspaceGridConfig = () => useContext(WorkspaceGridContext);
