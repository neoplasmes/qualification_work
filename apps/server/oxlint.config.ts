import { defineConfig } from 'oxlint';

import base from '../../oxlint.config.ts';

export default defineConfig({
    extends: [base],
    rules: {
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    { group: ['**/index', '**/index.ts'] },
                    { regex: '^@/(?!core/ports/)\\w+/\\w+/.+' },
                    { regex: '^@/core/ports/\\w+/.+' },
                    {
                        regex: '(?!primitive-server)[\\d-]',
                        message: 'no digits or hyphens in dir/file names',
                    },
                ],
            },
        ],
    },
});
