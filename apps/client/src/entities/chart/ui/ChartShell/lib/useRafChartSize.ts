import { useRafElementSize } from '@/shared/ui/tools/useRafElementSize';

type UseRafChartSizeOptions = {
    ignoreHeight?: boolean;
};

export const useRafChartSize = <T extends HTMLElement = HTMLDivElement>({
    ignoreHeight = false,
}: UseRafChartSizeOptions = {}) => {
    const { ref, size } = useRafElementSize<T>({ ignoreHeight });

    return {
        ref,
        width: size.width,
        height: size.height,
    };
};
