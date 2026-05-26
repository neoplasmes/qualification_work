let draftCounter = 0;

export const createDraftId = () => {
    draftCounter += 1;

    return `draft-${draftCounter}`;
};
