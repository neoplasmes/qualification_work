import { defineConfig } from 'oxlint';

export default defineConfig({
    jsPlugins: ['@stylistic/eslint-plugin'],
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
        '@stylistic/padding-line-between-statements': [
            'error',
            {
                blankLine: 'always',
                prev: '*',
                next: ['return', 'throw', 'break', 'continue'],
            },
        ],
    },
    ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**'],
});
