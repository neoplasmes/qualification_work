import base from '../../.prettierrc.js';

/** @type {import('prettier').Config} */
export default {
    ...base,
    importOrder: [
        '<BUILTIN_MODULES>',
        '<THIRD_PARTY_MODULES>',
        '',
        '^@/app',
        '',
        '^@/pages',
        '',
        '^@/widgets',
        '',
        '^@/features',
        '',
        '^@/entities',
        '',
        '^@/shared',
        '',
        '^(\\.\\.\\/){3,}',
        '',
        '^(\\.\\.\\/|\\.\\/)(?!.*\\.s?css$)',
        '',
        '\\.s?css$',
    ],
};
