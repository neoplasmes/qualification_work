import { useSelector } from 'react-redux';

// oxlint-disable-next-line fsd/no-upper-layer-import, fsd/no-cross-slice-dependency
import type { RootState } from '@/app/model/store';

export const useAppSelector = useSelector.withTypes<RootState>();
