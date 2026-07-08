import path from 'path';

const FSDLayers = ['shared', 'entities', 'features', 'widgets', 'pages'];

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

                const currentFilePath = context.filename;
                const parts = currentFilePath.split(path.sep);

                const currentLayerIndex = parts.findIndex(part =>
                    FSDLayers.includes(part)
                );
                if (currentLayerIndex === -1) {
                    return;
                }

                const currentSlice = parts[currentLayerIndex + 1];
                const currentLayer = parts[currentLayerIndex];

                const isRelative = importPath.startsWith('.');
                const isAlias = importPath.startsWith('@/');

                if (!isRelative && !isAlias) {
                    return;
                }

                if (isRelative) {
                    const currentDir = path.dirname(currentFilePath);
                    const resolved = path.resolve(currentDir, importPath);
                    const resolvedParts = resolved.split(path.sep);

                    const importedLayerIndex = resolvedParts.findIndex(part =>
                        FSDLayers.includes(part)
                    );
                    if (importedLayerIndex === -1) {
                        return;
                    }

                    const importedSlice = resolvedParts[importedLayerIndex + 1];

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

                    if (!FSDLayers.includes(importedLayer)) {
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
