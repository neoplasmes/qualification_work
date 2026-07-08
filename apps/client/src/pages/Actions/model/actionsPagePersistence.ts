import { actionsPageInitialState, type ActionsPageState } from './actionsPageSlice';

type ActionsPagePersisted = Pick<ActionsPageState, 'rightPanelTab'>;

export const actionsPagePersistence = {
    key: 'actionsPage_v1',
    fallbackState: {
        rightPanelTab: 'history',
    } satisfies ActionsPagePersisted,
    getInitialState: (persistedState: ActionsPagePersisted): ActionsPageState => ({
        ...actionsPageInitialState,
        rightPanelTab: persistedState.rightPanelTab,
    }),
    pickPersistedState: (state: ActionsPageState): ActionsPagePersisted => ({
        rightPanelTab: state.rightPanelTab,
    }),
};
