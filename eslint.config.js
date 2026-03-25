import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default defineConfig(
    // Игнорируемые папки для всего монорепо
    {
        ignores: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    },

    // Базовые правила JS
    eslint.configs.recommended,

    // Базовые правила TS
    tseslint.configs.recommended,

    // Отключает ESLint правила конфликтующие с Prettier
    prettier,

    // Общие правила для всего монорепо
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
        },
    }
);
