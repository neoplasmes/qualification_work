import React from 'react';

import { useGetPostQuery } from '@/shared/api/api';

import classes from './TestStyleModules.module.scss';

export const TestStyleModules = () => {
    const { data, isLoading } = useGetPostQuery(1);

    return (
        <div className={classes.widget}>
            <div className={classes.title}>adadadadadadadadadad</div>
            <div className={classes.dataBox}>
                {isLoading ? (
                    'lodaing'
                ) : (
                    <div>
                        <strong>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Temporibus libero incidunt ipsa architecto ipsum dicta
                            debitis, quis, aperiam quaerat dignissimos deleniti illum ab
                            qui rerum eaque exercitationem, provident corporis? Pariatur?
                        </strong>{' '}
                        {data?.title}
                    </div>
                )}
            </div>
        </div>
    );
};
