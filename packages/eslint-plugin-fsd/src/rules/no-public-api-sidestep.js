import { importedPath, legacyPath, sourcePath } from './frontend-architecture.js';

const fsdLayers = ['entities', 'features', 'widgets', 'pages'];

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'imports allowed only from index.ts files',
        },
        messages: {
            noSidestep: 'imports allowed only from index.ts files',
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

                if (!to || from.startsWith(`${to.split('/').slice(0, 2).join('/')}/`)) {
                    return;
                }

                const parts = ['@', ...to.split('/')];

                // [0] - @
                const layer = parts[1];
                const slice = parts[2];
                const hasDeepPath = parts.length > 3; // есть что-то после слайса

                if (!fsdLayers.includes(layer)) {
                    return;
                }
                if (!slice || !hasDeepPath) {
                    return;
                }

                context.report({
                    node,
                    messageId: 'noSidestep',
                });
            },
        };
    },
};

export default rule;
