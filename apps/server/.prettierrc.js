import base from '../../.prettierrc.js';

/** @type {import('prettier').Config} */
export default {
    ...base,
    importOrder: [
        '<BUILTIN_MODULES>',
        '<THIRD_PARTY_MODULES>',
        '',
        '^@/core',
        '',
        '^@/implementation',
        '',
        '^@/common',
        '',
        '^@/infrastructure',
        '',
        '^(\\.\\.\\/){3,}',
        '',
        '^[./]',
    ],
};
