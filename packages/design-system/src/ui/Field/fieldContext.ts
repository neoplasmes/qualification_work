import { createContext } from 'react';

export const fieldContext = createContext<{ id?: string; labelId?: string; describedBy?: string; invalid?: boolean }>({});
