import { readFileSync } from 'node:fs';
import stylelint from 'stylelint';

const source = JSON.parse(readFileSync(new URL('./packages/design-system/src/theme/tokens.json', import.meta.url), 'utf8'));
const tokenValues = new Map();
const categories = { color: new Set(), spacing: new Set(), radius: new Set(), shadow: new Set(), border: new Set(), family: new Set(), size: new Set(), line: new Set(), weight: new Set(), tracking: new Set() };

for (const category of ['color', 'spacing', 'radius', 'shadow', 'border']) {
    for (const token of source[category].tokens) {
        tokenValues.set(`--${token.name}`, token.value);
        categories[category].add(`--${token.name}`);
    }
}

for (const [family, value] of Object.entries(source.type.families)) {
    tokenValues.set(`--font-${family}`, value);
    categories.family.add(`--font-${family}`);
}

for (const group of source.type.groups) {
    for (const variant of group.styles) {
        for (const [field, prefix, category] of [['fontSize', 'font-size', 'size'], ['lineHeight', 'line-height', 'line'], ['fontWeight', 'font-weight', 'weight'], ['letterSpacing', 'letter-spacing', 'tracking']]) {
            if (field in variant) {
                const name = `--${prefix}-${variant.name}`;
                tokenValues.set(name, String(variant[field]));
                categories[category].add(name);
            }
        }
    }
}

const ruleName = 'design-system/token-contract';
const tokenContract = stylelint.createPlugin(ruleName, (enabled) => (root, result) => {
    if (!enabled) {
        return;
    }

    root.walkDecls((declaration) => {
        const property = declaration.prop;
        const value = declaration.value;
        const references = [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]);
        let invalid = references.some((name) => !tokenValues.has(name));

        if (property.startsWith('--')) {
            invalid ||= !tokenValues.has(property) || tokenValues.get(property) !== value;
        } else {
            let category;
            let neutral = ['inherit'];
            let expression = false;

            if (/^(color|background(?:-color)?|border(?:-.+)?-color|border-color|outline-color|accent-color|fill|stroke)$/.test(property)) {
                category = 'color';
                neutral = ['inherit', 'transparent', 'currentColor', 'none'];
            } else if (property === 'font-family') {
                category = 'family';
            } else if (property === 'font-size') {
                category = 'size';
            } else if (property === 'font-weight') {
                category = 'weight';
            } else if (property === 'line-height') {
                category = 'line';
                neutral.push('normal');
            } else if (property === 'letter-spacing') {
                category = 'tracking';
                neutral.push('normal');
            } else if (property === 'font') {
                invalid ||= value !== 'inherit';
            } else if (/^(gap|row-gap|column-gap|padding(?:-.+)?|margin(?:-.+)?|outline-offset)$/.test(property)) {
                category = 'spacing';
                neutral = ['0', 'auto', 'normal', 'inherit'];
                expression = true;
            } else if (property === 'box-shadow') {
                category = 'shadow';
                neutral = ['none', 'inherit'];
            } else if (/^border(?:-.+)?-radius$/.test(property) || property === 'border-radius') {
                category = 'radius';
                neutral.push('0');
            } else if (/^(border(?:-(?:top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?|outline)$/.test(property)) {
                const validBorder = /^var\(\s*(--[\w-]+)\) (solid|dashed|double) var\(\s*(--[\w-]+)\)$/.exec(value);
                invalid ||= !['0', 'none', 'inherit'].includes(value) && !(validBorder && categories.border.has(validBorder[1]) && categories.color.has(validBorder[3]));
            } else if (/^(border(?:-.+)?-width|outline-width|text-decoration-thickness)$/.test(property)) {
                category = 'border';
                neutral = ['0', 'inherit', 'auto'];
            }

            if (category && !neutral.includes(value)) {
                const directToken = /^var\(\s*(--[\w-]+)\)$/.exec(value);
                const negativeToken = /^calc\(-1 \* var\(\s*(--[\w-]+)\)\)$/.exec(value);
                const validOverlap = property.startsWith('margin') && negativeToken && categories.border.has(negativeToken[1]);
                invalid ||= !(directToken && categories[category].has(directToken[1])) && !(expression && negativeToken && categories[category].has(negativeToken[1])) && !validOverlap;
            }
        }

        if (invalid) {
            stylelint.utils.report({ ruleName, result, node: declaration, message: `use the canonical token contract for ${property}: ${value}` });
        }
    });
});

export default {
    extends: ['stylelint-config-standard'],
    plugins: [tokenContract],
    rules: {
        'declaration-empty-line-before': null,
        'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global', 'local'] }],
        'import-notation': null,
    },
    overrides: [
        { files: ['**/*.scss'], extends: ['stylelint-config-standard-scss'] },
        {
            files: ['packages/design-system/**/*.css'],
            rules: {
                'property-disallowed-list': ['/^(grid|grid-.+)$/'],
                'declaration-property-value-disallowed-list': {
                    display: ['/\\b(?:inline-)?grid\\b/'],
                    'min-width': ['/^[-+]?0+(?:\\.0+)?(?:[a-z]+|%)?$/i'],
                },
                'selector-class-pattern': '^[a-z][a-zA-Z0-9]*$',
                'custom-property-empty-line-before': null,
                'value-keyword-case': ['lower', { ignoreProperties: ['/^--font-/'] }],
            },
        },
        {
            files: ['packages/design-system/src/**/*.css'],
            rules: { [ruleName]: true },
        },
        {
            files: ['packages/design-system/src/theme/tokens.css'],
            rules: { 'color-function-notation': null, 'color-function-alias-notation': null, 'alpha-value-notation': null },
        },
    ],
};
