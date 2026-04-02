import * as path from 'path';
import { formatFiles, generateFiles } from '@nx/devkit';

/**
 * Ну понятно да
 *
 * @param {*} tree
 * @param {*} options
 */
export default async function repositoryServiceGenerator(tree, options) {
    const { type, name } = options;
    const pascalName = name.charAt(0).toUpperCase() + name.slice(1);
    const typeNormalized = type === 'repository' ? 'repositories' : 'services';
    const suffix = type === 'repository' ? 'Repository' : 'Service';

    const portDir = `apps/server/src/core/ports/${typeNormalized}/${name}`;
    const implementationDir = `apps/server/src/implementation/${typeNormalized}/${name}`;

    generateFiles(tree, path.join(import.meta.dirname, 'templates/port'), portDir, {
        name,
        pascalName,
        suffix,
        fileName: `${name}.${type}`,
    });

    generateFiles(
        tree,
        path.join(import.meta.dirname, 'templates/impl'),
        implementationDir,
        {
            name,
            pascalName,
            suffix,
            fileName: `${name}.${type}`,
        }
    );

    await formatFiles(tree);
}
