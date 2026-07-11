import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';
import { parse } from 'postcss';
import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
const source = JSON.parse(readFileSync(`${packageRoot}src/theme/tokens.json`, 'utf8'));
const expected = new Map<string, string>();

for (const category of ['color', 'spacing', 'radius', 'shadow', 'border']) {
    for (const token of source[category].tokens) {
        expected.set(`--${token.name}`, token.value);
    }
}

for (const [family, value] of Object.entries(source.type.families)) {
    expected.set(`--font-${family}`, String(value));
}

for (const group of source.type.groups) {
    for (const style of group.styles) {
        for (const [field, prefix] of [['fontSize', 'font-size'], ['lineHeight', 'line-height'], ['fontWeight', 'font-weight'], ['letterSpacing', 'letter-spacing']]) {
            if (field in style) {
                expected.set(`--${prefix}-${style.name}`, String(style[field]));
            }
        }
    }
}

describe('canonical token contract', () => {
    it('ships the verified source json snapshot', () => {
        const snapshot = readFileSync(`${packageRoot}src/theme/tokens.json`);
        expect(createHash('sha256').update(snapshot).digest('hex')).toBe('1d5dab008f77a2f2b1882fafdd143c112e0a0dfef6bf574ff25f1b780fa7856e');
    });

    it('projects exactly the source names and values', () => {
        const actual = new Map<string, string>();
        const stylesheet = parse(readFileSync(`${packageRoot}src/theme/tokens.css`, 'utf8'));
        stylesheet.walkDecls((declaration) => {
            if (declaration.prop.startsWith('--')) {
                actual.set(declaration.prop, declaration.value);
            }
        });

        expect(expected.size).toBe(81);
        expect(actual).toEqual(expected);
    });

    it('uses only canonical variables in production css', () => {
        const violations: string[] = [];
        for (const path of globSync('src/**/*.css', { cwd: packageRoot })) {
            const stylesheet = parse(readFileSync(`${packageRoot}${path}`, 'utf8'));
            stylesheet.walkDecls((declaration) => {
                if (declaration.prop.startsWith('--') && !expected.has(declaration.prop)) {
                    violations.push(`${path}: ${declaration.prop}`);
                }
                for (const match of declaration.value.matchAll(/var\(\s*(--[\w-]+)/g)) {
                    if (!expected.has(match[1])) {
                        violations.push(`${path}: ${match[1]}`);
                    }
                }
            });
        }

        expect(violations).toEqual([]);
    });

    it('keeps the existing scss consumer lint boundary', async () => {
        const result = await stylelint.lint({
            files: `${workspaceRoot}apps/client/src/shared/ui/Separator/Separator.module.scss`,
            configFile: `${workspaceRoot}stylelint.config.js`,
        });
        expect(result.errored).toBe(false);
    });

    it('rejects invented variables and wrong property categories through real stylelint', async () => {
        const cases = [
            '.probe { --space-secret: 18px; }',
            '.probe { color: var(--color-secret); }',
            '.probe { width: var( --geometry-secret ); }',
            '.probe { color: var(--space-4); }',
            '.probe { border: 1px solid #fff; }',
            '.probe { font-size: 18px; }',
            '.probe { padding: 2px; }',
            '.probe { box-shadow: 0 1px 0 var(--ink); }',
            '.probe { accent-color: var(--space-4); }',
        ];
        for (const code of cases) {
            const result = await stylelint.lint({ code, codeFilename: `${packageRoot}src/theme/contract.module.css`, configFile: `${workspaceRoot}stylelint.config.js` });
            expect(result.errored, code).toBe(true);
        }

        const result = await stylelint.lint({
            code: '.probe {\n color: var(--ink);\n padding: var(--space-4);\n border: var(--border-hair) solid var(--ink);\n margin-inline-start: calc(-1 * var(--border-hair));\n}',
            codeFilename: `${packageRoot}src/theme/contract.module.css`, configFile: `${workspaceRoot}stylelint.config.js`,
        });
        expect(result.errored).toBe(false);
    });
});
