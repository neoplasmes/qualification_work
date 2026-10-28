import { importedPath, legacyPath, sourcePath } from './frontend-architecture.js';

const fsdLayers = ['shared', 'entities', 'features', 'widgets', 'pages'];

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'use @/ alias for cross-slice imports, use relative paths for same-slice imports',
        },
        messages: {
            useAlias: 'use @/ alias instead of relative path for cross-slice imports',
            useRelative: 'use relative path instead of @/ alias for same-slice imports',
        },
    },

    create(context) {
        return {
            ImportDeclaration(node) {
                const importPath = node.source.value;

                const from = sourcePath(context);

                if (!from || !legacyPath(from)) {
                    return;
                }

                const [currentLayer, currentSlice] = from.split('/');

                if (!fsdLayers.includes(currentLayer)) {
                    return;
                }

                const isRelative = importPath.startsWith('.');
                const isAlias = importPath.startsWith('@/');

                if (!isRelative && !isAlias) {
                    return;
                }

                if (isRelative) {
                    const to = importedPath(from, importPath);
                    const [importedLayer, importedSlice] = to.split('/');

                    if (!fsdLayers.includes(importedLayer)) {
                        return;
                    }

                    if (importedSlice !== currentSlice) {
                        context.report({ node, messageId: 'useAlias' });
                    }
                }

                if (isAlias) {
                    // @/layer/slice/...
                    const aliasParts = importPath.split('/');
                    // [0] - @
                    const importedLayer = aliasParts[1];
                    const importedSlice = aliasParts[2];

                    if (!fsdLayers.includes(importedLayer)) {
                        return;
                    }

                    if (
                        importedLayer === currentLayer &&
                        importedSlice === currentSlice
                    ) {
                        context.report({ node, messageId: 'useRelative' });
                    }
                }
            },
        };
    },
};

export default rule;
