import { NotFoundError } from '@qualification-work/microservice-utils';
import type { OrgMembership } from '@qualification-work/microservice-utils/internalAuth';
import type {
    PreviewDashboardMetricPayload,
    PreviewDashboardMetricResponse,
} from '@qualification-work/types';

import type { DashboardRepo } from '@/core/ports/driven/repos';
import type { Executable, ExecutableIO } from '@/core/ports/driving';

import { getReadableOrgIds } from '@/shared/checkOrgMembership';

export class PreviewDashboardMetricQuery implements Executable<
    [PreviewDashboardMetricPayload, OrgMembership[]],
    Promise<PreviewDashboardMetricResponse>
> {
    constructor(private readonly dashboardRepo: DashboardRepo) {}

    async execute(
        metric: PreviewDashboardMetricPayload,
        orgs: OrgMembership[]
    ): Promise<PreviewDashboardMetricResponse> {
        const result = await this.dashboardRepo.previewMetric(
            metric,
            getReadableOrgIds(orgs)
        );

        if (!result) {
            throw new NotFoundError(`Dataset ${metric.datasetId} not found`);
        }

        return result;
    }
}

export type PreviewDashboardMetricQueryIO = ExecutableIO<PreviewDashboardMetricQuery>;
