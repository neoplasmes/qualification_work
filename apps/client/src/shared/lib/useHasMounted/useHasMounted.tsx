import { useEffect, useState } from 'react';

export const useHasMounted = (): boolean => {
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    return mounted;
};
