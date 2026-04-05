import base from '../../oxlint.config.ts';
import { defineConfig } from 'oxlint';

export default defineConfig({
    extends: [base],
    rules: {
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    { group: ['**/index', '**/index.ts'] },
                    { regex: '^@/(?!core/ports/)\\w+/\\w+/.+' },
                ],
            },
        ],
    },
});
