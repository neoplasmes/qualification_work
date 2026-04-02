import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
    {
        ignores: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    },
    eslint.configs.recommended,
    tseslint.configs.recommended,
    prettier,
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            curly: ['error', 'all'],
            'no-useless-assignment': 'off',
            'preserve-caught-error': 'off',
            'no-multiple-empty-lines': ['error', { max: 10 }],
            'prettier/prettier': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
            ],
            '@typescript-eslint/no-empty-object-type': 'off',
            'padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: '*', next: 'return' },
                { blankLine: 'always', prev: '*', next: 'throw' },
            ],
        },
    }
);
