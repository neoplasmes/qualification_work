import type { Key, ReactNode, TableHTMLAttributes } from 'react';

import styles from './Table.module.scss';

export type TableRow = {
    id?: Key;
    key: ReactNode;
    value: ReactNode;
};

type TableHeaders = {
    key: string;
    value: string;
};

type TableProps = {
    headers: TableHeaders;
    rows: TableRow[];
} & Omit<TableHTMLAttributes<HTMLTableElement>, 'children'>;

export const Table = ({ headers, rows, className, ...props }: TableProps) => (
    <table
        className={[styles['table'], className ?? ''].filter(Boolean).join(' ')}
        {...props}
    >
        <thead>
            <tr>
                <th scope="col">{headers.key}</th>
                <th scope="col">{headers.value}</th>
            </tr>
        </thead>
        <tbody>
            {rows.map((row, index) => (
                <tr key={row.id ?? index}>
                    <th scope="row">{row.key}</th>
                    <td>{row.value}</td>
                </tr>
            ))}
        </tbody>
    </table>
);
