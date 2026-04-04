import { defineConfig } from 'eslint/config';

import baseConfig from '../../eslint.config.js';

export default defineConfig(...baseConfig, {
    rules: {
        'no-useless-assignment': 'off',
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    {
                        group: ['**/index', '**/index.ts'],
                    },
                    {
                        regex: '^@/(?!core/ports/)\\w+/\\w+/.+',
                    },
                ],
                paths: [
                    {
                        name: 'use-only-globally-typed-handlers',
                        importNames: ['RequestHandler'],
                        message: 'use RequestHandlerType instead',
                    },
                ],
            },
        ],
    },
});
