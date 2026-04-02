import * as path from 'path';
import { formatFiles, generateFiles } from '@nx/devkit';

function toPascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default async function (tree, options) {
    const { type, name } = options;
    const pascalName = toPascalCase(name);
    const typePlural = type === 'command' ? 'commands' : 'queries';
    const targetDir = `apps/server/src/core/${typePlural}/${name}`;

    generateFiles(tree, path.join(import.meta.dirname, 'templates'), targetDir, {
        name,
        pascalName,
        camelName: name,
    });

    await formatFiles(tree);
}
