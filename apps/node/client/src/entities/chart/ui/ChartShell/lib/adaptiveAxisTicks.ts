type AdaptiveAxisTickOptions = {
    labels: string[];
    availableSpace: number;
    minSpacing: number;
};

export const getAdaptiveAxisTickLabels = ({
    labels,
    availableSpace,
    minSpacing,
}: AdaptiveAxisTickOptions) => {
    if (labels.length <= 2) {
        return labels;
    }

    if (availableSpace <= 0 || minSpacing <= 0) {
        return [labels[0], labels[labels.length - 1]];
    }

    const maxVisible = Math.max(2, Math.floor(availableSpace / minSpacing) + 1);
    if (labels.length <= maxVisible) {
        return labels;
    }

    const step = Math.ceil((labels.length - 1) / (maxVisible - 1));

    return labels.filter(
        (_label, index) =>
            index === 0 || index === labels.length - 1 || index % step === 0
    );
};
