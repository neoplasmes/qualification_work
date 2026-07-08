import { readFileSync } from 'node:fs';

const cache = new Map<string, string>();

export function loadScript(path: string): string {
    const cached = cache.get(path);
    if (cached !== undefined) {
        return cached;
    }

    const content = readFileSync(path, 'utf8');
    cache.set(path, content);

    return content;
}
