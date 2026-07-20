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
        { from: 'main/router/routes.tsx', to: 'app/ui/Layout' },
        { from: 'main/router/routes.tsx', to: 'app/ui/WorkspaceLayout' },
        { from: 'main/router/routes.tsx', to: 'pages/Entrance' },
        { from: 'main/router/routes.tsx', to: 'pages/Profile' },
        { from: 'main/dependencies/dependencies.ts', to: 'app/model/store' },
        { from: 'main/sessionLifecycle/sessionLifecycle.ts', to: 'app/model/store' },
        {
            from: 'main/sessionLifecycle/sessionLifecycle.ts',
            to: 'app/model/persistence',
        },
        { from: 'main/sessionLifecycle/sessionLifecycle.ts', to: 'pages/Actions' },
        { from: 'main/sessionLifecycle/sessionLifecycle.ts', to: 'pages/Datasets' },
        { from: 'main/sessionLifecycle/sessionLifecycle.ts', to: 'pages/Dashboards' },
        {
            from: 'main/sessionLifecycle/sessionLifecycle.ts',
            to: 'features/filterApplicationEntities',
        },
        { from: 'shared/model/useAppSelector/useAppSelector.ts', to: 'app/model/store' },
        { from: 'shared/lib/useHasMounted/useHasMounted.tsx', to: 'react' },
        { from: 'shared/lib/useRafElementSize/useRafElementSize.ts', to: 'react' },
        { from: 'shared/lib/useRafThrottle/useRafThrottle.ts', to: 'react' },
    ] satisfies Array<{ from: string; to: string }>,
};

export default architecture;
