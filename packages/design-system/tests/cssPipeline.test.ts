import { fileURLToPath } from 'node:url';
import { parse } from 'postcss';
import { build } from 'vite';
import { expect, test } from 'vitest';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));

test('compiles modern css through the real vite pipeline', async () => {
    const result = await build({
        root: packageRoot,
        configFile: `${packageRoot}vite.config.ts`,
        logLevel: 'silent',
        build: {
            write: false,
            minify: false,
            cssMinify: false,
            lib: { entry: `${packageRoot}tests/fixtures/index.ts`, formats: ['es'] },
        },
    });
    const builds = Array.isArray(result) ? result : [result];
    const output = builds.flatMap((item) => 'output' in item ? item.output : []);
    const css = output.filter((item) => item.type === 'asset').filter((item) => item.fileName.endsWith('.css'))
        .map((item) => String(item.source)).join('\n');
    const js = output.filter((item) => item.type === 'chunk').map((item) => item.code).join('\n');

    const stylesheet = parse(css);
    const fixtureColors: string[] = [];

    stylesheet.walkRules((rule) => {
        if (!/^\._probe_[a-z0-9_]+$/.test(rule.selector)) {
            return;
        }

        rule.walkDecls('color', (declaration) => {
            fixtureColors.push(declaration.value);
        });
    });

    expect(css).not.toContain('&:hover');
    expect(fixtureColors).toEqual(expect.arrayContaining([expect.stringMatching(/^rgba?\(/)]));
    expect(css).toContain('--fixture-paper: #f7f6f3');
    expect(css).toContain('var(--fixture-paper)');
    expect(css).toContain('--paper: #f7f6f3');
    expect(/font-family: ['"]IBM Plex Mono['"]/.test(css)).toBe(true);
    expect(css).toContain('cyrillic');
    expect(js).toContain('HStack');
    expect(js).toContain('VStack');
    expect(js).toContain('Text');
    expect(css).toContain('@layer reset, tokens, primitives, typography, components;');
    expect(js).toMatch(/probe:\s*["']_probe_/);
});
