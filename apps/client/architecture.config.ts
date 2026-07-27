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
    legacyImports: [] satisfies Array<{ from: string; to: string }>,
};

export default architecture;
