import type { Organization } from '../organization';
import type { User } from './user.entity';

export interface Session {
    user: User;
    organizations: Organization[];
    isInitializing: boolean;
}
