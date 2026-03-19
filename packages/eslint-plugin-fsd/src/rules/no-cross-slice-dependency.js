import path from 'path';

const FSDLayers = ['entities', 'features', 'widgets', 'pages'];

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'no imports from the same slices',
        },
        messages: {
            crossSlice: 'no imports from the same slices',
        },
    },

    create(context) {
        return {
            ImportDeclaration(node) {
                const importPath = node.source.value;

                if (!importPath.startsWith('@/')) return;

                const currentFilePath = context.filename;
                const parts = currentFilePath.split(path.sep);

                const currentLayerIndex = parts.findIndex(part => FSDLayers.includes(part));

                if (currentLayerIndex === -1) return;

                const currentLayer = parts[currentLayerIndex];
                const currentSlice = parts[currentLayerIndex + 1];

                if (!currentSlice) return;

                const importParts = importPath.split('/');
                // [0] - @
                const importedLayer = importParts[1];
                const importedSlice = importParts[2];

                if (!importedSlice) return;

                if (importedLayer === currentLayer && importedSlice !== currentSlice) {
                    context.report({
                        node,
                        messageId: 'crossSlice',
                    });
                }
            },
        };
    },
};

export default rule;
