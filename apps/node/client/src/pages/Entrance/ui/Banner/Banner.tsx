import { m } from 'motion/react';

import { Logo } from '@/shared/ui';

import styles from './Banner.module.scss';

const chartHeights = [42, 72, 60, 35, 85, 100, 63, 77, 49, 11];

export const Banner = () => {
    return (
        <aside
            data-stack="v"
            data-justify="between"
            data-gap="md"
            data-py="lg"
            data-pl="lg"
            data-pr="md"
            className={styles['banner']}
        >
            <Logo />
            <h1 className={styles['headline']}>
                Precision
                <br />
                Analytics for the
                <br />
                <span>
                    Modern
                    <br />
                    Enterprise.
                </span>
            </h1>
            <p className={styles['subheadline']}>
                Take your data analysis to the next level with BI Tool
            </p>
            <figure
                data-stack="v"
                data-py="md"
                data-gap="sm"
                className={styles['chart-container']}
            >
                <div
                    data-stack="h"
                    data-gap="sm-plus"
                    data-pb="md-plus"
                    className={styles['chart']}
                    data-align="end"
                >
                    {chartHeights.map((height, index) => (
                        <m.div
                            key={index}
                            className={`${styles['bar']} ${height === 100 ? styles['accent'] : ''}`}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{
                                delay: index * 0.1,
                                ease: 'easeOut',
                                duration: 0.6,
                            }}
                        />
                    ))}
                </div>
                <figcaption
                    data-stack="h"
                    className={styles['chart-footer']}
                    data-justify="between"
                >
                    &copy; 2026 BI Tool. Open-source.
                </figcaption>
            </figure>
        </aside>
    );
};
