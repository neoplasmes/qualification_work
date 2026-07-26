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
            from: 'main/dependencies/dependencies.ts',
            to: 'app/model/store',
        },
        {
            from: 'main/sessionLifecycle/sessionLifecycle.ts',
            to: 'app/model/store',
        },
        {
            from: 'ui/pages/charts/ui/ChartsLeftPanel/ChartsLeftPanel.tsx',
            to: 'entities/dashboard',
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
            from: 'ui/pages/datasets/ui/DatasetsLeftPanel/DatasetsLeftPanel.tsx',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/widgets/FilterPanel/lib/createFilterPanelItems.ts',
            to: 'entities/dashboard',
        },
        {
            from: 'ui/widgets/FilterPanel/model/useFilterPanelSources.ts',
            to: 'entities/dashboard',
        },
    ] satisfies Array<{ from: string; to: string }>,
};

export default architecture;
