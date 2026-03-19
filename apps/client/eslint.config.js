import { defineConfig } from 'eslint/config';
import react from 'eslint-plugin-react';

import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import fsd from '@qualification-work/eslint-plugin-fsd';
import baseConfig from '../../eslint.config.js';

export default defineConfig(
    // базовый конфиг монорепо
    ...baseConfig,
    // не даёт вставить это как плагин
    reactHooks.configs.flat.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            react,
            fsd,
        },
        languageOptions: {
            globals: globals.browser,
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            ...react.configs.recommended.rules,
            'react-hooks/exhaustive-deps': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'fsd/no-cross-slice-dependency': 'error',
            'fsd/no-public-api-sidestep': 'error',
            'fsd/no-upper-layer-import': 'error',
            'fsd/prefer-alias-import': 'error',
        },
    }
);
