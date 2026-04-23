export function parseCookiesMiddleware(header: string): Record<string, string> {
    const result: Record<string, string> = {};
    const parts = header.split(';');

    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) {
            continue;
        }

        const eqIndex = trimmed.indexOf('=');

        if (eqIndex === -1) {
            result[trimmed] = '';
        } else {
            const key = trimmed.slice(0, eqIndex);
            const val = trimmed.slice(eqIndex + 1);
            result[key] = val;
        }
    }

    return result;
}
