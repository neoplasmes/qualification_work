import { defineConfig } from 'oxlint';

export default defineConfig({
    rules: {
        curly: ['error', 'all'],
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-explicit-any': 'warn',
        'consistent-type-imports': [
            'error',
            {
                prefer: 'type-imports',
                fixStyle: 'separate-type-imports',
            },
        ],
        'no-empty-object-type': 'off',
    },
    ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**'],
});
