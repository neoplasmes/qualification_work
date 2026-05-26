import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useLazyGetMeQuery } from '../api';

const wait = (delay: number) => new Promise<void>(resolve => setTimeout(resolve, delay));

export const useWaitForWorkspace = () => {
    const navigate = useNavigate();
    const [getMe] = useLazyGetMeQuery();
    const [isPreparingWorkspace, setIsPreparingWorkspace] = useState(false);

    const waitForWorkspace = async () => {
        setIsPreparingWorkspace(true);

        try {
            for (let attempt = 0; attempt < 40; attempt += 1) {
                const me = await getMe(undefined, false).unwrap();

                if (!me.isInitializing && me.organizations.length > 0) {
                    navigate('/datasets', { replace: true });

                    return;
                }

                await wait(250);
            }

            throw new Error('Workspace is still preparing. Please try again shortly.');
        } finally {
            setIsPreparingWorkspace(false);
        }
    };

    return { waitForWorkspace, isPreparingWorkspace };
};
