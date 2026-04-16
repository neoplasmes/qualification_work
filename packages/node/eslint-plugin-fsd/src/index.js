import noCrossSliceDependency from './rules/no-cross-slice-dependency.js';
import noPublicApiSidestep from './rules/no-public-api-sidestep.js';
import noUpperLayerImport from './rules/no-upper-layer-import.js';
import preferAliasImport from './rules/prefer-alias-import.js';

const plugin = {
    meta: {
        name: '@qualification-work/eslint-plugin-fsd',
        version: '1.0.0',
        namespace: 'fsd',
    },
    rules: {
        'no-public-api-sidestep': noPublicApiSidestep,
        'no-cross-slice-dependency': noCrossSliceDependency,
        'no-upper-layer-import': noUpperLayerImport,
        'prefer-alias-import': preferAliasImport,
    },
    configs: {},
    processors: {},
};

export default plugin;
