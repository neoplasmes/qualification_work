import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import type { RequestContext } from 'primitive-server';

const MIMETypes: Record<string, string> = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.ico': 'image/x-icon',
};

export function serveStatic(rootDir: string, urlPrefix: string) {
    const prefix = urlPrefix.endsWith('/') ? urlPrefix : urlPrefix + '/';
    const resolvedRoot = path.resolve(rootDir);

    return async ({ request, response }: RequestContext) => {
        const rawPath = request.URL.slice(prefix.length);
        const cleanPath = rawPath.split('?')[0];
        const filePath = path.resolve(resolvedRoot, cleanPath);

        if (!filePath.startsWith(resolvedRoot)) {
            response.status(403).text('Forbidden');

            return;
        }

        let fileStat;
        try {
            fileStat = await stat(filePath);
        } catch {
            response.status(404).text('Not Found');

            return;
        }

        if (!fileStat.isFile()) {
            response.status(404).text('Not Found');

            return;
        }

        const lastModified = fileStat.mtime.toUTCString();
        const ifModifiedSince = request.getHeader('if-modified-since');

        // Мы перезапрашиваем статику как только она была изменена, это не супер идеально, но у нас
        // учебный проект всё таки
        if (ifModifiedSince && new Date(ifModifiedSince) >= fileStat.mtime) {
            response.status(304).end();

            return;
        }

        const extension = path.extname(filePath);
        // тип, который говорит браузеру просто скачать код
        const contentType = MIMETypes[extension] ?? 'application/octet-stream';

        // просто заголовки
        response.status(200).head({
            'Content-Type': contentType,
            'Content-Length': fileStat.size,
            'Last-Modified': lastModified,
            'Cache-Control': 'public, max-age=86400, must-revalidate',
        });

        await response.stream(createReadStream(filePath));
    };
}
