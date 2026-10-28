import { readFileSync } from 'node:fs';
import { parse } from 'postcss';

// token name prefixes in tokens.css; the first matching prefix wins, colors take the rest
const categoryPrefixes = [
    ['spacing', '--space-'],
    ['radius', '--radius-'],
    ['shadow', '--shadow-'],
    ['border', '--border-'],
    ['size', '--font-size-'],
    ['weight', '--font-weight-'],
    ['line', '--line-height-'],
    ['tracking', '--letter-spacing-'],
    ['family', '--font-'],
];

const regexpChars = /[.*+?^${}()|[\]\\/]/g;

/**
 * builds stylelint rules that keep css on the canonical tokens declared in tokens.css
 *
 * @param tokensUrl
 * @returns
 */
export const extractTokensToStylelint = tokensUrl => {
    const names = {
        color: [],
        spacing: [],
        radius: [],
        shadow: [],
        border: [],
        size: [],
        weight: [],
        line: [],
        tracking: [],
        family: [],
    };
    const values = {};

    parse(readFileSync(tokensUrl, 'utf8')).walkDecls(declaration => {
        const name = declaration.prop;

        if (!name.startsWith('--') || name in values) {
            return;
        }

        values[name] = [`/^${declaration.value.replace(regexpChars, '\\$&')}$/`];
        names[
            categoryPrefixes.find(([, prefix]) => name.startsWith(prefix))?.[0] ?? 'color'
        ].push(name);
    });

    const all = Object.values(names).flat();
    const tokens = {};

    for (const category in names) {
        tokens[category] = `var\\(\\s*(?:${names[category].join('|')})\\s*\\)`;
    }

    return {
        'custom-property-pattern': `^(?:${all.join('|').replaceAll('--', '')})$`,
        'declaration-property-value-disallowed-list': {
            '/.*/': [`/var\\(\\s*(?!(?:${all.join('|')})\\s*[,)])--/`],
        },
        'declaration-property-value-allowed-list': {
            ...values,
            '/^(color|background(?:-color)?|border(?:-.+)?-color|outline-color|accent-color|fill|stroke)$/':
                [`/^${tokens.color}$/`, 'inherit', 'transparent', 'currentColor', 'none'],
            'font-family': [`/^${tokens.family}$/`, 'inherit'],
            'font-size': [`/^${tokens.size}$/`, 'inherit'],
            'font-weight': [`/^${tokens.weight}$/`, 'inherit'],
            'line-height': [`/^${tokens.line}$/`, 'inherit', 'normal'],
            'letter-spacing': [`/^${tokens.tracking}$/`, 'inherit', 'normal'],
            font: ['inherit'],
            '/^margin(?:-.+)?$/': [
                `/^${tokens.spacing}$/`,
                `/^calc\\(-1 \\* ${tokens.spacing}\\)$/`,
                `/^calc\\(-1 \\* ${tokens.border}\\)$/`,
                '0',
                'auto',
                'normal',
                'inherit',
            ],
            '/^(gap|row-gap|column-gap|padding(?:-.+)?|outline-offset)$/': [
                `/^${tokens.spacing}$/`,
                `/^calc\\(-1 \\* ${tokens.spacing}\\)$/`,
                '0',
                'auto',
                'normal',
                'inherit',
            ],
            'box-shadow': [`/^${tokens.shadow}$/`, 'none', 'inherit'],
            '/^border(?:-.+)?-radius$/': [`/^${tokens.radius}$/`, 'inherit', '0'],
            '/^(border(?:-(?:top|right|bottom|left|block|inline|block-start|block-end|inline-start|inline-end))?|outline)$/':
                [
                    `/^${tokens.border} (solid|dashed|double) ${tokens.color}$/`,
                    '0',
                    'none',
                    'inherit',
                ],
            '/^(border(?:-.+)?-width|outline-width|text-decoration-thickness)$/': [
                `/^${tokens.border}$/`,
                '0',
                'inherit',
                'auto',
            ],
        },
    };
};
