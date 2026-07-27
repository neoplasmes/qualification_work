import { defineConfig } from 'oxlint';

import base from '../../oxlint.config.ts';
import architecture from './architecture.config.ts';

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
        // final boundaries have no production legacy exceptions
        'fsd/frontend-architecture': ['error', architecture],
        'fsd/no-cross-slice-dependency': 'error',
        'fsd/no-public-api-sidestep': 'error',
        'fsd/no-upper-layer-import': 'error',
        'fsd/prefer-alias-import': 'error',
    },
});
