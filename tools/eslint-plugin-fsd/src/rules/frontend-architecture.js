import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pageSegments = new Set([
    'model',
    'ui',
    'lib',
    'api',
    'types',
    'const',
    'config',
    'assets',
    'test',
]);

const browserGlobals = new Set(['globalThis']);
const standardGlobals = new Set();
const typescriptLibrary = path.dirname(fileURLToPath(import.meta.resolve('typescript')));
const declarations =
    /^(?:declare\s+)?(?:abstract\s+)?(?:interface|type|var|let|const|function|class|enum|namespace)\s+([A-Za-z_$][\w$]*)/gm;

for (const filename of readdirSync(typescriptLibrary)) {
    const platformLibrary = /^lib\.(?:dom|webworker)(?:\.[\w.]+)?\.d\.ts$/.test(filename);
    const standardLibrary = /^lib\.es[\w.]*\.d\.ts$/.test(filename);

    if (!platformLibrary && !standardLibrary) {
        continue;
    }

    const names = platformLibrary ? browserGlobals : standardGlobals;
    const source = readFileSync(path.join(typescriptLibrary, filename), 'utf8');

    for (const match of source.matchAll(declarations)) {
        names.add(match[1]);
    }
}

for (const name of standardGlobals) {
    browserGlobals.delete(name);
}

export function sourcePath(context) {
    const filename = context.filename.replaceAll('\\', '/');
    const marker = '/apps/client/src/';
    const markerIndex = filename.lastIndexOf(marker);
    const root =
        context.options[0]?.sourceRoot ??
        (markerIndex >= 0
            ? filename.slice(0, markerIndex + marker.length - 1)
            : path.resolve(context.cwd, 'src'));
    const relative = path.relative(root, filename).replaceAll('\\', '/');

    return relative.startsWith('../') ? undefined : relative;
}

export function importedPath(from, imported) {
    if (imported.startsWith('@/')) {
        return path.posix.normalize(imported.slice(2));
    }

    if (imported.startsWith('.')) {
        return path.posix.normalize(path.posix.join(path.posix.dirname(from), imported));
    }

    return undefined;
}

export function legacyPath(
    filename,
    legacyRoots = [
        'entities',
        'features',
        'widgets',
        'pages',
        'app/config',
        'app/model',
        'app/ui',
    ]
) {
    const parts = filename.split('/');
    const root = parts[0] === 'app' ? parts.slice(0, 2).join('/') : parts[0];

    return legacyRoots.includes(root);
}

const rule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'enforce frontend architecture dependencies and public APIs',
        },
        schema: [{ type: 'object', additionalProperties: true }],
        messages: {
            boundary: 'frontend architecture forbids this dependency',
            publicApi: 'import the module public API through its folder',
            framework: 'this framework belongs outside this module',
            browser: 'app and core cannot access browser APIs; inject data through ports',
        },
    },

    create(context) {
        const config = context.options[0] ?? {};
        const from = sourcePath(context);

        if (!from) {
            return {};
        }

        const layer = from.split('/')[0];
        const isLegacy = legacyPath(from, config.legacyRoots);
        const isTest =
            /(?:^|\/)test\//.test(from) || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(from);

        function checkDependency(node) {
            const imported = node.source?.value;

            if (typeof imported !== 'string') {
                return;
            }

            const to = importedPath(from, imported);

            if (!to) {
                if (
                    (isLegacy && !imported.startsWith('@tanstack/')) ||
                    (isTest && layer !== 'app' && layer !== 'core') ||
                    (config.legacyImports ?? []).some(
                        pair => pair.from === from && pair.to === imported
                    )
                ) {
                    return;
                }

                const isReact =
                    /^(?:react|react-dom|react-router|react-router-dom)(?:\/|$)/.test(
                        imported
                    );
                const isTanstack = imported.startsWith('@tanstack/');
                const isZustand = /^zustand(?:\/|$)/.test(imported);
                const isCache = from.startsWith('env/cache/');
                const isHook =
                    /(?:^|\/)use[A-Z][^/]*\.[jt]sx?$/.test(from) ||
                    from.includes('/hooks/');
                const frameworkForbidden =
                    ((layer === 'app' || layer === 'core') &&
                        (isReact ||
                            isTanstack ||
                            isZustand ||
                            imported.startsWith('node:') ||
                            /^(?:react-redux|@reduxjs\/|motion\/react)/.test(
                                imported
                            ))) ||
                    (isReact &&
                        !(
                            layer === 'main' ||
                            layer === 'ui' ||
                            from.startsWith('shared/ui/') ||
                            (isCache &&
                                (isHook ||
                                    /^env\/cache\/context\/(?:context\.ts|cacheProvider\.tsx)$/.test(
                                        from
                                    ))) ||
                            /^entry\.(?:client|server)\.tsx$/.test(from)
                        )) ||
                    (isTanstack &&
                        (!(isCache || layer === 'main') ||
                            /(?:router|start)/.test(imported))) ||
                    (isZustand &&
                        !(
                            layer === 'main' ||
                            isCache ||
                            from.startsWith('shared/model/') ||
                            (layer === 'ui' && from.includes('/model/'))
                        ));

                if (frameworkForbidden) {
                    context.report({ node, messageId: 'framework' });
                }

                return;
            }

            const repo = from.startsWith('env/repos/')
                ? from.split('/').slice(0, 3).join('/')
                : undefined;
            const localRepo = repo && (to === repo || to.startsWith(`${repo}/`));
            const concreteRepo = to === 'env/repos' || to.startsWith('env/repos/');

            if (concreteRepo && layer !== 'main' && !localRepo && !isTest) {
                context.report({ node, messageId: 'boundary' });

                return;
            }

            if (isTest || isLegacy) {
                return;
            }

            if (legacyPath(to, config.legacyRoots)) {
                if (
                    !(config.legacyImports ?? []).some(
                        pair => pair.from === from && pair.to === to
                    )
                ) {
                    context.report({ node, messageId: 'boundary' });
                }

                return;
            }

            const edge = from.startsWith('env/transport/') ? 'env/transport' : layer;
            const allowed = config.allowedEdges?.[edge];

            if (
                allowed &&
                !allowed.some(target => to === target || to.startsWith(`${target}/`))
            ) {
                context.report({ node, messageId: 'boundary' });

                return;
            }

            if (
                !allowed &&
                !['ui', 'app', 'env', 'core', 'shared', 'main'].includes(layer)
            ) {
                return;
            }

            let moduleRoot;
            const parts = to.replace(/\.[cm]?[jt]sx?$/, '').split('/');

            if (to.startsWith('ui/pages/')) {
                const segment = parts.findIndex(
                    (part, index) => index > 2 && pageSegments.has(part)
                );
                const implementation = parts.findIndex(part => part.includes('.page'));
                const boundary = segment >= 0 ? segment : implementation;

                if (boundary >= 0) {
                    moduleRoot = parts.slice(0, boundary).join('/');
                }
            } else if (to.startsWith('ui/widgets/')) {
                moduleRoot = parts.slice(0, 3).join('/');
            } else if (
                /^(?:core\/(?:entities|processes)|app\/(?:commands|queries)|env\/(?:repos|cache|transport|tools))\//.test(
                    to
                )
            ) {
                moduleRoot = parts.slice(0, 3).join('/');
            } else if (/^app\/ports\/(?:repos|tools)\//.test(to)) {
                moduleRoot = parts.slice(0, 4).join('/');
            }

            const local = moduleRoot && from.startsWith(`${moduleRoot}/`);
            const publicTarget =
                !moduleRoot ||
                to === moduleRoot ||
                /^index(?:\.[cm]?[jt]sx?)?$/.test(to.slice(moduleRoot.length + 1));

            if (!local && !publicTarget) {
                context.report({ node, messageId: 'publicApi' });
            }
        }

        return {
            ImportDeclaration: checkDependency,
            ExportNamedDeclaration: checkDependency,
            ExportAllDeclaration: checkDependency,
            ImportExpression: checkDependency,
            Identifier(node) {
                if (
                    isLegacy ||
                    (layer !== 'app' && layer !== 'core') ||
                    !browserGlobals.has(node.name)
                ) {
                    return;
                }

                if (
                    node.name === 'AbortSignal' &&
                    node.parent.type === 'TSTypeReference'
                ) {
                    return;
                }

                const scope = context.sourceCode.getScope(node);
                const reference = scope.references.find(item => item.identifier === node);

                if (
                    reference &&
                    (!reference.resolved || reference.resolved.defs.length === 0)
                ) {
                    context.report({ node, messageId: 'browser' });
                }
            },
        };
    },
};

export default rule;
