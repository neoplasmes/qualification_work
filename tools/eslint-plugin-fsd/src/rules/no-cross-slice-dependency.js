import { importedPath, legacyPath, sourcePath } from './frontend-architecture.js';

const fsdLayers = ['entities', 'features', 'widgets', 'pages'];

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
                const from = sourcePath(context);

                if (!from || !legacyPath(from)) {
                    return;
                }

                const to = importedPath(from, node.source.value);

                if (!to) {
                    return;
                }

                const [currentLayer, currentSlice] = from.split('/');

                if (!fsdLayers.includes(currentLayer) || !currentSlice) {
                    return;
                }

                const importParts = ['@', ...to.split('/')];
                // [0] - @
                const importedLayer = importParts[1];
                const importedSlice = importParts[2];

                if (!importedSlice) {
                    return;
                }

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
