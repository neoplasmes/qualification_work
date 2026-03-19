import { defineConfig } from 'eslint/config';

import baseConfig from '../../eslint.config.js';

export default defineConfig(
    // базовый конфиг монорепо
    ...baseConfig,
    {
        rules: {
            'no-useless-assignment': 'off',
        },
    }
);
