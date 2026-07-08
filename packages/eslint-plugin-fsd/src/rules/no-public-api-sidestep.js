const FSDLayers = ['entities', 'features', 'widgets', 'pages'];

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
                const importPath = node.source.value;

                if (!importPath.startsWith('@/')) {
                    return;
                }

                const parts = importPath.split('/');

                // [0] - @
                const layer = parts[1];
                const slice = parts[2];
                const hasDeepPath = parts.length > 3; // есть что-то после слайса

                if (!FSDLayers.includes(layer)) {
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
