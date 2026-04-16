import path from 'path';

const FSDLayers = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'imports allowed only from lower FSD layers',
        },
        messages: {
            upperLayer: 'imports allowed only from lower FSD layers',
        },
    },

    create(context) {
        return {
            ImportDeclaration(node) {
                const importPath = node.source.value;

                if (!importPath.startsWith('@/')) {
                    return;
                }

                const currentFilePath = context.filename;
                const parts = currentFilePath.split(path.sep);
                const currentLayerIndex = FSDLayers.findIndex(layer =>
                    parts.includes(layer)
                );

                if (currentLayerIndex === -1) {
                    return;
                }

                const importedLayer = importPath.replace('@/', '').split('/')[0];
                const importedLayerIndex = FSDLayers.indexOf(importedLayer);

                if (importedLayerIndex === -1) {
                    return;
                }

                if (importedLayerIndex > currentLayerIndex) {
                    context.report({
                        node,
                        messageId: 'upperLayer',
                    });
                }
            },
        };
    },
};

export default rule;
