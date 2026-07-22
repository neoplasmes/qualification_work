import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useActiveOrganization, useSession } from '@/ui/session';

import { getSelected } from '@/shared/lib/getSelected';

import { useDatasetsPageActions, useDatasetsPageState } from '../usePageState';

export function useDatasetsController() {
    const dependencies = useDependencies();
    const session = useSession();
    const { activeOrg: org } = useActiveOrganization(session.data);
    const { selectDataset, setShowUpload } = useDatasetsPageActions();
    const selectedDatasetId = useDatasetsPageState(state => state.selectedDatasetId);
    const showUpload = useDatasetsPageState(state => state.showUpload);
    const datasetsQuery = useRead(
        dependencies.listDatasets,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org?.id) }
    );
    const selectedDataset = getSelected(
        datasetsQuery.data,
        selectedDatasetId,
        item => item.dataset.id
    );

    return {
        session,
        org,
        datasetsQuery,
        selectedDataset,
        showUpload,
        selectDataset,
        setShowUpload,
        handleUploadSuccess: async (datasetId: string) => {
            selectDataset(datasetId);
            await dependencies.cache.read(dependencies.listDatasets, { orgId: org!.id });
        },
    };
}
