import { actionsPageInitialState, type ActionsPageState } from './actionsPageSlice';

type ActionsPagePersisted = Pick<
    ActionsPageState,
    'selectedActionId' | 'workspaceTab' | 'rightPanelTab'
>;

export const actionsPagePersistence = {
    key: 'actionsPage_v1',
    fallbackState: {
        selectedActionId: null,
        workspaceTab: 'configure',
        rightPanelTab: 'history',
    } satisfies ActionsPagePersisted,
    getInitialState: (persistedState: ActionsPagePersisted): ActionsPageState => ({
        ...actionsPageInitialState,
        selectedActionId: persistedState.selectedActionId,
        workspaceTab: persistedState.workspaceTab,
        rightPanelTab: persistedState.rightPanelTab,
        isCreatingAction: false,
    }),
    pickPersistedState: (state: ActionsPageState): ActionsPagePersisted => ({
        selectedActionId: state.selectedActionId,
        workspaceTab: state.workspaceTab,
        rightPanelTab: state.rightPanelTab,
    }),
};
