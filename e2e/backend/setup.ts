import fs from 'node:fs';
import https from 'node:https';
import tls from 'node:tls';
import { z } from 'zod';

console.log('[setup] NODE_EXTRA_CA_CERTS:', process.env.NODE_EXTRA_CA_CERTS);

z.string({ error: 'NODE_EXTRA_CA_CERTS is not set' }).parse(
    process.env.NODE_EXTRA_CA_CERTS
);

const caCert = fs.readFileSync(String(process.env.NODE_EXTRA_CA_CERTS));

const existing = https.globalAgent.options.ca;
const existingAsArray =
    existing === undefined
        ? [...tls.rootCertificates]
        : Array.isArray(existing)
          ? existing
          : [existing];

https.globalAgent.options.ca = [...existingAsArray, caCert];

/**
 * setup.ts runs in a kind of isolated process, so there is workaround for this
 *
 * the thing is that fetch ignores custom certs there in setup.ts
 *
 * @param {string} url
 * @param {number} expectedStatus
 * @returns {Promise<boolean>}
 */
const httpsGet = (url: string, expectedStatus: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        https
            .get(url, res => {
                res.resume();
                resolve(res.statusCode === expectedStatus);
            })
            .on('error', reject);
    });
};

/**
 * helper to wait for auth healty conditions
 *
 * @async
 * @param {string} name
 * @param {() => Promise<boolean>} check
 * @param {number} [timeoutMs=5_000]
 * @param {number} [intervalMs=500]
 * @returns {Promise<void>}
 */
const waitFor = async (
    name: string,
    check: () => Promise<boolean>,
    timeoutMs = 10_000,
    intervalMs = 500
): Promise<void> => {
    const deadline = Date.now() + timeoutMs;
    let lastErr: unknown = null;

    while (Date.now() < deadline) {
        try {
            if (await check()) {
                return;
            }
        } catch (err) {
            lastErr = err;
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error(
        `[e2e/backend]: timeout waiting for ${name}` +
            (lastErr ? `: ${lastErr instanceof Error ? lastErr.message : lastErr}` : '')
    );
};

/**
 * vitest global setup
 *
 * @export
 * @async
 * @returns {Promise<void>}
 */
export default async (): Promise<void> => {
    const gatewayBase = process.env.GATEWAY_BASE ?? 'https://localhost:8443';

    await waitFor('gateway /_gateway/health', () =>
        httpsGet(`${gatewayBase}/_gateway/health`, 200)
    );

    await waitFor('auth /api/auth/me', () => httpsGet(`${gatewayBase}/api/auth/me`, 401));
};
