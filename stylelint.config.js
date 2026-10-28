import { extractTokensToStylelint } from './tools/exctract-tokens-to-stylelint/index.js';

const tokenRules = extractTokensToStylelint(
    new URL('./packages/design-system/src/theme/tokens.css', import.meta.url)
);

// design-system layout bans; repeated in the token override because overrides replace rule options
const layoutDisallowed = {
    display: ['/\\b(?:inline-)?grid\\b/'],
    'min-width': ['/^[-+]?0+(?:\\.0+)?(?:[a-z]+|%)?$/i'],
};

export default {
    extends: ['stylelint-config-standard'],
    plugins: ['stylelint-use-nesting', 'stylelint-order'],
    rules: {
        'declaration-empty-line-before': null,
        'selector-pseudo-class-no-unknown': [
            true,
            { ignorePseudoClasses: ['global', 'local'] },
        ],
        'import-notation': null,
        'csstools/use-nesting': 'always',
        'order/order': ['custom-properties', 'declarations', 'rules', 'at-rules'],
    },
    overrides: [
        { files: ['**/*.scss'], extends: ['stylelint-config-standard-scss'] },
        {
            files: ['packages/design-system/**/*.css'],
            rules: {
                'property-disallowed-list': ['/^(grid|grid-.+)$/'],
                'declaration-property-value-disallowed-list': layoutDisallowed,
                'selector-class-pattern': '^[a-z][a-zA-Z0-9]*$',
                'custom-property-empty-line-before': null,
                'value-keyword-case': ['lower', { ignoreProperties: ['/^--font-/'] }],
            },
        },
        {
            files: ['packages/design-system/src/**/*.css'],
            rules: {
                ...tokenRules,
                'declaration-property-value-disallowed-list': {
                    ...layoutDisallowed,
                    ...tokenRules['declaration-property-value-disallowed-list'],
                },
            },
        },
        {
            files: ['packages/design-system/src/theme/tokens.css'],
            rules: {
                'color-function-notation': null,
                'color-function-alias-notation': null,
                'alpha-value-notation': null,
            },
        },
    ],
};
