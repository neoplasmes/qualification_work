import base from '../../../prettier.config.js';

/** @type {import('prettier').Config} */
export default {
    ...base,
    importOrder: [
        '<BUILTIN_MODULES>',
        '<THIRD_PARTY_MODULES>',
        '',
        '^@qualification-work',
        '',
        '^@/core',
        '',
        '^@/adapters',
        '',
        '^@/shared',
        '',
        '^@/infrastructure',
        '',
        '^(\\.\\.\\/){3,}',
        '',
        '^[./]',
    ],
};
