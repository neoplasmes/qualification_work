import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';

const theme = postcss.parse(
    readFileSync(
        new URL('./packages/design-system/src/theme/theme.css', import.meta.url),
        'utf8'
    )
);
const layerOrder = theme.nodes.find(
    node => node.type === 'atrule' && node.name === 'layer' && !node.nodes
);

if (!layerOrder) {
    throw new Error('the design-system theme must declare its cascade layer order');
}

export default {
    plugins: [
        {
            postcssPlugin: 'theme-layer-order',
            Once(root) {
                root.prepend(layerOrder.clone());
            },
        },
        postcssPresetEnv({
            stage: 0,
            preserve: true,
            enableClientSidePolyfills: false,
            features: { 'nesting-rules': true },
        }),
    ],
};
