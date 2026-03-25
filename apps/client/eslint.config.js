import fsd from '@qualification-work/eslint-plugin-fsd';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

import baseConfig from '../../eslint.config.js';

export default defineConfig(
    // базовый конфиг монорепо
    ...baseConfig,
    // не даёт вставить это как плагин
    reactHooks.configs.flat.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            fsd,
        },
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            'react-hooks/exhaustive-deps': 'off',
            'fsd/no-cross-slice-dependency': 'error',
            'fsd/no-public-api-sidestep': 'error',
            'fsd/no-upper-layer-import': 'error',
            'fsd/prefer-alias-import': 'error',
        },
    }
);
