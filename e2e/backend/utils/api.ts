export const GATEWAY_BASE = process.env.GATEWAY_BASE ?? 'https://localhost:8443';

export type ApiInit = RequestInit & { cookie?: string };

/**
 * does a fetch through the openresty gateway and attaches the cookie header if provided.
 *
 * @export
 * @async
 * @param {string} path
 * @param {ApiInit} [init={}]
 * @returns {Promise<Response>}
 */
export const api = async (path: string, init: ApiInit = {}): Promise<Response> => {
    const headers = new Headers(init.headers);

    if (
        !(init.body instanceof FormData) &&
        init.body !== undefined &&
        !headers.has('Content-Type')
    ) {
        headers.set('Content-Type', 'application/json');
    }

    if (init.cookie) {
        headers.set('Cookie', init.cookie);
    }

    return fetch(`${GATEWAY_BASE}${path}`, { ...init, headers });
};

/**
 * look at the name
 *
 * @param {Response} response
 * @returns {(string | null)}
 */
export const extractSessionCookie = (response: Response): string | null => {
    const setCookie = response.headers.get('set-cookie');
    if (!setCookie) {
        return null;
    }

    const match = setCookie.match(/session=([^;]+)/);

    return match ? `session=${match[1]}` : null;
};
