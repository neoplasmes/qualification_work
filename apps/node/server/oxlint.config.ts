import { defineConfig } from 'oxlint';

import base from '@qualification-work/microservice-config/oxlint';

export default defineConfig({
    extends: [base],
    // TODO: update config rules to match ARCHITECTURE.md declaration and respectively update structure in apps/node/server
    rules: {
        'no-restricted-imports': [
            'error',
            {
                patterns: [{ group: ['**/index', '**/index.ts'] }],
            },
        ],
    },
});
