import { importedPath, legacyPath, sourcePath } from './frontend-architecture.js';

const fsdLayers = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];

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
                const from = sourcePath(context);

                if (!from || !legacyPath(from)) {
                    return;
                }

                const to = importedPath(from, node.source.value);

                if (!to || (to.startsWith('app/') && !legacyPath(to))) {
                    return;
                }

                const currentLayerIndex = fsdLayers.indexOf(from.split('/')[0]);
                const importedLayer = to.split('/')[0];
                const importedLayerIndex = fsdLayers.indexOf(importedLayer);

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
