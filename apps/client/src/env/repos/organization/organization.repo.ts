import {
    errorPayloadSchema,
    parseResponse,
    receiptSchema,
} from '@/env/tools/responseSchema';
import { HttpError, type HttpRequest, type HttpTransport } from '@/env/transport/http';

import {
    OrganizationError,
    type CreateOrgInput,
    type CreateOrgResult,
    type DeleteOrgInput,
    type OrganizationErrorCode,
    type OrganizationRepo,
} from '@/app/ports/repos/organization';

export class HttpOrganizationRepo implements OrganizationRepo {
    constructor(private readonly transport: HttpTransport) {}

    async createOrganization(input: CreateOrgInput): Promise<CreateOrgResult> {
        const { name, displayName, ownerId } = input;

        return parseResponse(
            receiptSchema,
            await this.request({
                path: '/orgs',
                method: 'POST',
                body: { name, displayName, ownerId },
                responseType: 'json',
            })
        );
    }

    async deleteOrganization({ orgId }: DeleteOrgInput): Promise<void> {
        await this.request({
            path: `/orgs/${encodeURIComponent(orgId)}`,
            method: 'DELETE',
            responseType: 'text',
        });
    }

    private async request(request: HttpRequest): Promise<unknown> {
        try {
            return await this.transport.request(request);
        } catch (cause) {
            if (!(cause instanceof HttpError)) {
                throw cause;
            }
            const codes: Partial<Record<number, OrganizationErrorCode>> = {
                400: 'validation',
                401: 'unauthenticated',
                404: 'notFound',
                409: 'conflict',
            };
            const code = codes[cause.status];
            if (!code) {
                throw cause;
            }
            const payload = errorPayloadSchema.safeParse(cause.payload);
            const defaults: Record<OrganizationErrorCode, string> = {
                validation: 'Invalid request data',
                unauthenticated: 'Session expired',
                notFound: 'Organization not found',
                conflict: 'Organization already exists',
            };

            throw new OrganizationError(
                code,
                cause.status,
                payload.success && payload.data.error
                    ? payload.data.error
                    : defaults[code],
                { cause },
                payload.success ? payload.data.fields : undefined
            );
        }
    }
}
