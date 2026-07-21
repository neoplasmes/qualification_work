const architecture = {
    sourceRoot: `${import.meta.dirname}/src`,
    allowedEdges: {
        ui: ['ui', 'app', 'core', 'shared', 'env/cache'],
        app: ['app', 'core', 'shared/lib'],
        env: ['env', 'app', 'core', 'shared/lib'],
        core: ['core', 'shared/lib'],
        shared: ['shared'],
        main: ['main', 'ui', 'app', 'env', 'core', 'shared'],
        'env/transport': ['env/transport', 'shared/lib'],
    },
    legacyRoots: [
        'entities',
        'features',
        'widgets',
        'pages',
        'app/config',
        'app/model',
        'app/ui',
    ],
    legacyImports: [
        {
            from: 'ui/pages/charts/model/pageState/pageState.store.ts',
            to: 'widgets/ChartBuilder',
        },
        {
            from: 'main/dependencies/dependencies.ts',
            to: 'app/model/store',
        },
        {
            from: 'main/sessionLifecycle/sessionLifecycle.ts',
            to: 'app/model/store',
        },
        {
            from: 'ui/pages/actions/Actions.page.tsx',
            to: 'entities/action',
        },
        {
            from: 'ui/pages/actions/const/testIds.ts',
            to: 'widgets/ActionBuilder',
        },
        {
            from: 'ui/pages/actions/lib/actionRunValues.ts',
            to: 'entities/action',
        },
        {
            from: 'ui/pages/actions/lib/actionRunValues.ts',
            to: 'widgets/ActionBuilder',
        },
        {
            from: 'ui/pages/actions/lib/uiHelpers.ts',
            to: 'entities/action',
        },
        {
            from: 'ui/pages/actions/ui/ActionEditor/ActionEditor.tsx',
            to: 'entities/action',
        },
        {
            from: 'ui/pages/actions/ui/ActionEditor/ActionEditor.tsx',
            to: 'widgets/ActionBuilder',
        },
        {
            from: 'ui/pages/actions/ui/ActionEditor/ui/ActionConfigureTab/ActionConfigureTab.tsx',
            to: 'entities/action',
        },
        {
            from: 'ui/pages/actions/ui/ActionEditor/ui/ActionConfigureTab/ActionConfigureTab.tsx',
            to: 'features/manageActions',
        },
        {
            from: 'ui/pages/actions/ui/ActionEditor/ui/ActionConfigureTab/ActionConfigureTab.tsx',
            to: 'widgets/ActionBuilder',
        },
        {
            from: 'ui/pages/actions/ui/ActionEditor/ui/ActionRunTab/ActionRunTab.tsx',
            to: 'entities/action',
        },
        {
            from: 'ui/pages/actions/ui/ActionEditor/ui/ActionRunTab/ActionRunTab.tsx',
            to: 'features/manageActions',
        },
        {
            from: 'ui/pages/actions/ui/ActionEditor/ui/ActionRunTab/ui/RunForm/RunForm.tsx',
            to: 'entities/action',
        },
        {
            from: 'ui/pages/actions/ui/ActionsHistory/ActionsHistory.tsx',
            to: 'entities/action',
        },
        {
            from: 'ui/pages/actions/ui/ActionsLeftPanel/ActionsLeftPanel.tsx',
            to: 'entities/action',
        },
        {
            from: 'ui/pages/actions/ui/ActionsProperties/ActionsProperties.tsx',
            to: 'entities/action',
        },
        {
            from: 'ui/pages/actions/ui/ActionsProperties/ActionsProperties.tsx',
            to: 'features/manageActions',
        },
        {
            from: 'ui/pages/actions/ui/ActionsRightPanel/ActionsRightPanel.tsx',
            to: 'entities/action',
        },
        {
            from: 'ui/pages/charts/Charts.page.tsx',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/charts/Charts.page.tsx',
            to: 'widgets/ChartBuilder',
        },
        {
            from: 'ui/pages/charts/lib/useChartDataResult.ts',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/charts/ui/ChartBuilderSection/CreateChartBuilderSection.tsx',
            to: 'widgets/ChartBuilder',
        },
        {
            from: 'ui/pages/charts/ui/ChartsLeftPanel/ChartsLeftPanel.tsx',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/charts/ui/ChartsLeftPanel/ChartsLeftPanel.tsx',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/charts/ui/ChartsPropertiesPanel/ChartsPropertiesPanel.tsx',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/charts/ui/ChartsPropertiesPanel/ChartsPropertiesPanel.tsx',
            to: 'features/buildChart',
        },
        {
            from: 'ui/pages/charts/ui/SavedChartDetails/SavedChartDetails.tsx',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/dashboards/Dashboards.page.tsx',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/dashboards/Dashboards.page.tsx',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/Dashboards.page.tsx',
            to: 'features/manageDashboards',
        },
        {
            from: 'ui/pages/dashboards/ui/AddChartModal/AddChartModal.tsx',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardChartCard/DashboardChartCard.tsx',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardChartCard/DashboardChartCard.tsx',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardMetricModal/DashboardMetricModal.tsx',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardMetricModal/DashboardMetricModal.tsx',
            to: 'widgets/MetricBuilder',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardMetricModal/model/useDashboardMetricModal.ts',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardMetricModal/model/useDashboardMetricModal.ts',
            to: 'features/manageDashboards',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardMetricModal/model/useDashboardMetricModal.ts',
            to: 'widgets/MetricBuilder',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardWidgets/DashboardWidgets.tsx',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardWidgets/test/DashboardWidgets.testData.ts',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardWidgets/ui/ChartWidget/ChartWidget.tsx',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardWidgets/ui/MetricWidget/MetricWidget.tsx',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardWidgets/ui/MetricWidget/lib/metricGoal.ts',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardWidgets/ui/MetricWidget/lib/metricTrendDescription.ts',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardsLeftPanel/DashboardsLeftPanel.tsx',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardsLeftPanel/DashboardsLeftPanel.tsx',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardsLeftPanel/DashboardsLeftPanel.tsx',
            to: 'features/manageDashboards',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardsPropertiesPanel/DashboardsPropertiesPanel.tsx',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/dashboards/ui/DashboardsPropertiesPanel/DashboardsPropertiesPanel.tsx',
            to: 'features/manageDashboards',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetGrid/types.ts',
            to: 'entities/dataset',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetGrid/ui/DatasetGridEditor/DatasetGridEditor.tsx',
            to: 'features/manageDatasetTableOptions',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetWorkspace/lib/datasetCellValue/datasetCellValueHandlers.ts',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetWorkspace/lib/datasetCellValue/datasetDateCellValue.ts',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetWorkspace/model/useDatasetCellEditing.ts',
            to: 'entities/dataset',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetWorkspace/model/useDatasetColumnActions.ts',
            to: 'entities/dataset',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetWorkspace/model/useDatasetRowActions.ts',
            to: 'entities/dataset',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetWorkspace/model/useDatasetRowSelection.ts',
            to: 'entities/dataset',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetWorkspace/model/useDatasetRowsCache.ts',
            to: 'entities/dataset',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetsLeftPanel/DatasetsLeftPanel.tsx',
            to: 'entities/chart',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetsLeftPanel/DatasetsLeftPanel.tsx',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/pages/datasets/ui/DatasetsPropertiesPanel/DatasetsPropertiesPanel.tsx',
            to: 'entities/dataset',
        },
        {
            from: 'ui/pages/datasets/ui/MergeDatasetModal/MergeDatasetModal.tsx',
            to: 'features/uploadDataset',
        },
        {
            from: 'ui/pages/datasets/ui/MergeDatasetModal/ui/MergePreviewStep/MergePreviewStep.tsx',
            to: 'features/uploadDataset',
        },
        {
            from: 'ui/pages/datasets/ui/UploadDatasetModal/UploadDatasetModal.tsx',
            to: 'features/uploadDataset',
        },
        {
            from: 'ui/widgets/FilterPanel/lib/createFilterPanelItems.ts',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/widgets/FilterPanel/model/useFilterPanelSources.ts',
            to: 'entities/action',
        },
        {
            from: 'ui/widgets/FilterPanel/model/useFilterPanelSources.ts',
            to: 'entities/chart',
        },
        {
            from: 'ui/widgets/FilterPanel/model/useFilterPanelSources.ts',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/widgets/FilterPanel/FilterPanel.widget.tsx',
            to: 'entities/chart',
        },
    ] satisfies Array<{ from: string; to: string }>,
};

export default architecture;
