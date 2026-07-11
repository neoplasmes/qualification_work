import { Trash2 } from 'lucide-react';
import { Button, HStack, IconButton, Input, Link, Menu, Sheet, Text, VStack } from '@qualification-work/design-system';
import styles from './datasetsReference.module.css';

const navigation = ['Данные', 'Графики', 'Дашборды', 'Действия', 'Журнал'];
const tables = [
    ['Закупки данные', 'Изменена 25 мая 2026'], ['Аренда оборудования', 'Изменена 25 мая 2026'],
    ['Выручка', 'Используется в 2 графиках'], ['Реклама и заявки', 'Используется в 1 графике'],
    ['склад', 'Меняется действием'], ['продажи', 'Дополняется действием'],
];
const columns = ['Количество', 'Цена закупки', 'Сумма закупки', 'Стоимость доставки', 'Дней в пути'];
const rows = [
    ['75', '34', '476', '16 184', '3 927', '6'], ['76', '53', '34', '1 802', '3 526', '11'],
    ['77', '42', '307', '12 894', '1 441', '10'], ['78', '44', '56', '2 464', '3 340', '7'],
    ['79', '10', '377', '3 770', '0', '12'], ['80', '69', '52', '3 588', '0', '1'],
    ['81', '66', '122', '8 052', '3 400', '7'], ['82', '8', '34', '272', '3 218', '6'],
    ['83', '12', '201', '2 412', '1 573', '3'], ['84', '32', '141', '4 512', '0', '1'],
];
const menuItems = [
    { id: 'receive', label: 'Принять поставку на склад', href: '#receive' },
    { id: 'return', label: 'Оформить возврат поставщику', href: '#return' },
    { id: 'create', label: 'Новое действие для этой таблицы', href: '#create', quiet: true, separatorBefore: true },
];

export function DatasetsReference() {
    return <VStack className={styles.page}>
        <HStack as="nav" aria-label="Разделы" gap={32} align="baseline" wrap className={styles.nav}>
            <Text as="a" href="#start" variant="heading-sm" className={styles.brand}>BI Tool</Text>
            <HStack gap={24} wrap className={styles.navLinks}>
                {navigation.map((item, index) => <Link key={item} href={`#section-${index}`} aria-current={index === 0 ? 'page' : undefined} block>{item}</Link>)}
            </HStack>
            <HStack gap={24} wrap><Link as="button" type="button" variant="quiet" block>egor's organization</Link><Link as="button" type="button" variant="quiet" block>Егор</Link></HStack>
        </HStack>
        <HStack align="start" gap={48} wrap className={styles.layout}>
            <VStack as="aside" gap={12} className={styles.sidebar}>
                <Text as="div" variant="label" tone="mutedCanvas" className={styles.sidebarTitle}>Таблицы</Text>
                <VStack>
                    {tables.map(([name, subtitle], index) => <VStack as="a" key={name} href="#dataset" aria-current={index === 0 ? 'page' : undefined} className={styles.tableLink}>
                        <Text className={styles.tableName} tone={index === 0 ? 'inverse' : 'default'}>{name}</Text>
                        <Text variant="body-sm" tone={index === 0 ? 'inverse' : 'mutedCanvas'}>{subtitle}</Text>
                    </VStack>)}
                </VStack>
                <Sheet as="button" type="button" variant="well" className={styles.upload}>
                    <Text as="span" variant="lead" className={styles.uploadTitle}>Перетащите сюда Excel или CSV</Text>
                    <Text as="span" variant="body-sm" tone="mutedCanvas" className={styles.uploadHint}>Готовить файл не нужно</Text>
                </Sheet>
            </VStack>
            <VStack as="main" gap={20} className={styles.main}>
                <HStack justify="space-between" gap={32} wrap className={styles.heading}>
                    <Text as="h1" variant="heading">Закупки данные</Text>
                    <HStack gap={24} wrap align="end" className={styles.filters}>
                        <Input type="search" aria-label="Найти в таблице" placeholder="Найти в таблице" className={styles.search} />
                        <Link as="button" type="button" block>Фильтр</Link>
                        <Link as="button" type="button" block>Добавить строку</Link>
                        <Link as="button" type="button" block>Добавить столбец</Link>
                    </HStack>
                </HStack>
                <HStack role="toolbar" aria-label="Действия с выбранной строкой" gap={24} wrap className={styles.toolbar}>
                    <Link as="button" type="button" variant="quiet" block>Снять выделение</Link>
                    <Text variant="label" tone="mutedCanvas" className={styles.selection}>Выбрана строка 78</Text>
                    <Menu trigger={<span>Действия для этой строки</span>} items={menuItems} description="Поля заполнятся из строки 78" defaultOpen modal={false} triggerClassName={styles.menuTrigger} />
                    <Button variant="ghost">Дублировать</Button>
                    <IconButton danger aria-label="Удалить строку" title="Удалить строку"><Trash2 size={18} strokeWidth={1.8} aria-hidden="true" /></IconButton>
                </HStack>
                <Sheet className={styles.tableSurface}>
                    <div className={styles.tableScroll} role="region" aria-label="Закупки данные" tabIndex={0}>
                        <table className={styles.table}>
                            <thead><tr><th scope="col" className={styles.left}>№</th>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
                            <tbody>{rows.map(([number, ...cells]) => <tr key={number} aria-selected={number === '78'}><th scope="row" className={styles.left}>{number}</th>{cells.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody>
                            <tfoot><tr><th scope="row" className={styles.left}>Итого по выбранным</th><td>44</td><td /><td>2 464</td><td>3 340</td><td /></tr></tfoot>
                        </table>
                    </div>
                </Sheet>
                <HStack justify="space-between" align="baseline" gap={32} wrap className={styles.notes}>
                    <Text variant="body-sm" tone="mutedCanvas" className={styles.editHint}>Двойной щелчок по ячейке, чтобы изменить. Каждая правка попадает в <Link href="#journal">журнал</Link>.</Text>
                    <Text variant="body-sm" tone="mutedCanvas" className={styles.chartHint}>На этих данных построен график <Link href="#chart">Качество поставок</Link></Text>
                </HStack>
            </VStack>
        </HStack>
    </VStack>;
}
