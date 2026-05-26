import { actionsPageInitialState, type ActionsPageState } from './actionsPageSlice';

type ActionsPagePersisted = Pick<
    ActionsPageState,
    | 'selectedActionId'
    | 'workspaceTab'
    | 'rightPanelTab'
    | 'filtersTab'
    | 'searchText'
    | 'filterDatasetIds'
    | 'filterEffectKinds'
    | 'filterRunStatuses'
>;

export const actionsPagePersistence = {
    key: 'actionsPage_v1',
    fallbackState: {
        selectedActionId: null,
        workspaceTab: 'configure',
        rightPanelTab: 'history',
        filtersTab: 'datasets',
        searchText: '',
        filterDatasetIds: [],
        filterEffectKinds: [],
        filterRunStatuses: [],
    } satisfies ActionsPagePersisted,
    getInitialState: (persistedState: ActionsPagePersisted): ActionsPageState => ({
        ...actionsPageInitialState,
        ...persistedState,
        isCreatingAction: false,
    }),
    pickPersistedState: (state: ActionsPageState): ActionsPagePersisted => ({
        selectedActionId: state.selectedActionId,
        workspaceTab: state.workspaceTab,
        rightPanelTab: state.rightPanelTab,
        filtersTab: state.filtersTab,
        searchText: state.searchText,
        filterDatasetIds: state.filterDatasetIds,
        filterEffectKinds: state.filterEffectKinds,
        filterRunStatuses: state.filterRunStatuses,
    }),
};
