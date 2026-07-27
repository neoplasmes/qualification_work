import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

import architecture from '../../../architecture.config';

const sourceRoot = path.resolve(import.meta.dirname, '../..');
const retired = [...architecture.legacyRoots, 'shared/api', 'main/cacheBridge'];

it('has no retired physical roots or transition exceptions', () => {
    expect(architecture.legacyImports).toEqual([]);
    expect(
        readdirSync(sourceRoot, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .sort()
    ).toEqual(['app', 'core', 'env', 'main', 'shared', 'test', 'ui']);
    expect(retired.filter(root => existsSync(path.join(sourceRoot, root)))).toEqual([]);
});

it('resolves no executable imports into retired modules or Redux', () => {
    const config = ts.readConfigFile(
        path.join(sourceRoot, '../tsconfig.json'),
        ts.sys.readFile
    );
    const parsed = ts.parseJsonConfigFileContent(
        config.config,
        ts.sys,
        path.join(sourceRoot, '..')
    );
    const violations: string[] = [];
    for (const entry of readdirSync(sourceRoot, {
        recursive: true,
        withFileTypes: true,
    })) {
        if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) {
            continue;
        }
        const filename = path.join(entry.parentPath, entry.name);
        const source = ts.createSourceFile(
            filename,
            readFileSync(filename, 'utf8'),
            ts.ScriptTarget.Latest,
            true
        );
        const visit = (node: ts.Node) => {
            const target =
                ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
                    ? node.moduleSpecifier
                    : ts.isCallExpression(node) &&
                        node.expression.kind === ts.SyntaxKind.ImportKeyword
                      ? node.arguments[0]
                      : undefined;
            if (target && ts.isStringLiteral(target)) {
                const name = target.text;
                const resolved = ts.resolveModuleName(
                    name,
                    filename,
                    parsed.options,
                    ts.sys
                ).resolvedModule?.resolvedFileName;
                const relative = resolved && path.relative(sourceRoot, resolved);
                if (
                    /^(?:@reduxjs\/toolkit|react-redux|redux)(?:\/|$)/.test(name) ||
                    (relative &&
                        retired.some(
                            root => relative === root || relative.startsWith(`${root}/`)
                        ))
                ) {
                    violations.push(`${path.relative(sourceRoot, filename)} -> ${name}`);
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(source);
    }
    expect(violations).toEqual([]);
});
