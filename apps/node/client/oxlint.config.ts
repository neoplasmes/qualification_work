import { defineConfig } from 'oxlint';

import base from '../../../oxlint.config.ts';

export default defineConfig({
    extends: [base],
    jsPlugins: [
        {
            name: 'fsd',
            specifier: '@qualification-work/eslint-plugin-fsd',
        },
    ],
    rules: {
        'rules-of-hooks': 'error',
        'fsd/no-cross-slice-dependency': 'error',
        'fsd/no-public-api-sidestep': 'error',
        'fsd/no-upper-layer-import': 'error',
        'fsd/prefer-alias-import': 'error',
    },
});
