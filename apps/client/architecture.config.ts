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
        { from: 'entry.client.tsx', to: 'app/config' },
        { from: 'entry.client.tsx', to: 'app/model' },
        { from: 'entry.server.tsx', to: 'app/config' },
        { from: 'entry.server.tsx', to: 'app/model' },
        { from: 'global.d.ts', to: 'app/model' },
        { from: 'shared/model/useAppSelector/useAppSelector.ts', to: 'app/model/store' },
        { from: 'shared/lib/useHasMounted/useHasMounted.tsx', to: 'react' },
        { from: 'shared/lib/useRafElementSize/useRafElementSize.ts', to: 'react' },
        { from: 'shared/lib/useRafThrottle/useRafThrottle.ts', to: 'react' },
    ] satisfies Array<{ from: string; to: string }>,
};

export default architecture;
