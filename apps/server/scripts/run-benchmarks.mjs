import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const scriptLocationURL = new URL(import.meta.url);

const serverDir = resolve(dirname(scriptLocationURL.pathname), '..');
const configPath = join(serverDir, 'vitest.config.ts');

const timestamp = new Date()
    .toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .replace(/\..+/, '');

const ignoreFileOrDirectoryNames = new Set(['node_modules', 'dist', 'postgres']);

function findBenchFiles(dir) {
    const results = [];

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);

        if (entry.isDirectory() && !ignoreFileOrDirectoryNames.has(entry.name)) {
            results.push(...findBenchFiles(full));
        } else if (entry.isFile() && entry.name.endsWith('.bench.ts')) {
            results.push(full);
        }
    }

    return results;
}

const benchFiles = findBenchFiles(join(serverDir, 'src'));

if (benchFiles.length === 0) {
    console.log('бенчмарков не найдено');

    process.exit(0);
}

for (const benchFile of benchFiles) {
    const dir = dirname(benchFile);
    const name = basename(benchFile, '.bench.ts');
    const logDir = join(dir, `${name}-logs`);

    mkdirSync(logDir, { recursive: true });

    const outputFile = join(logDir, `${timestamp}.json`);

    console.log(`── ${benchFile}`);
    console.log(`   логи -> ${outputFile}\n`);

    execSync(
        `npx vitest bench ${benchFile} --config ${configPath} --outputJson=${outputFile}`,
        { stdio: 'inherit', cwd: serverDir }
    );

    console.log('');
}

console.log('готово');
