import { Landmark } from 'lucide-react';
import { m } from 'motion/react';

import styles from './Banner.module.scss';

const chartHeights = [42, 72, 60, 35, 85, 100, 63, 77, 49];

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
            <div data-stack="h" data-gap="sm" className={styles['logo']}>
                <Landmark size={24} />
                BI Tool
            </div>
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
                data-p="md"
                data-gap="md"
                className={styles['chart-container']}
            >
                <div
                    data-stack="h"
                    data-gap="sm-plus"
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
                    <span>BI tool</span>
                    <span>V1.0</span>
                </figcaption>
            </figure>
        </aside>
    );
};
