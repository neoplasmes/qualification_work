import { Landmark } from 'lucide-react';
import styles from './Logo.module.scss';

export type LogoProps = {
    text?: string;
    size?: number;
};

export const Logo = ({ text = 'BI Tool', size = 24 }: LogoProps) => {
    return (
        <div data-stack="h" data-gap="sm" className={styles['logo']}>
            <Landmark size={size} />
            {text}
        </div>
    );
};
