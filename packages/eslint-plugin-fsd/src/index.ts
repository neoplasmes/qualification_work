import noPublicApiSidestep from './rules/no-public-api-sidestep';
import noCrossSliceDependency from './rules/no-cross-slice-dependency';
import noUpperLayerImport from './rules/no-upper-layer-import';
import preferAliasImport from './rules/prefer-alias-import';

const plugin = {
    rules: {
        'no-public-api-sidestep': noPublicApiSidestep,
        'no-cross-slice-dependency': noCrossSliceDependency,
        'no-upper-layer-import': noUpperLayerImport,
        'prefer-alias-import': preferAliasImport,
    },
};

export default plugin;
