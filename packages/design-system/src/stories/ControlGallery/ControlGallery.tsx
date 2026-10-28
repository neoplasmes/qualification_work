import { Trash2 } from 'lucide-react';
import {
    Stamp,
    Button,
    Checkbox,
    Divider,
    Field,
    HStack,
    IconButton,
    Input,
    Link,
    Marker,
    Menu,
    Notice,
    NumberField,
    Radio,
    Choice,
    Select,
    Sheet,
    Text,
    Textarea,
    ValueDiff,
    VStack,
} from '@qualification-work/design-system';
import styles from './controlGallery.module.css';

const options = [
    { value: 'shop', label: 'Магазин' },
    { value: 'avito', label: 'Авито' },
    { value: 'site', label: 'Сайт', disabled: true },
];
const menuItems = [
    { id: 'receive', label: 'Принять поставку', href: '#receive' },
    { id: 'create', label: 'Новое действие', quiet: true, separatorBefore: true },
];

export function ControlGallery() {
    return (
        <VStack gap={32} className={styles.gallery}>
            <Text as="h1" variant="heading">
                BI Tool · Контролы
            </Text>
            <HStack gap={12} wrap>
                <Button>Сохранить</Button>
                <Button variant="ghost">Дублировать</Button>
                <Button variant="danger">Удалить</Button>
                <Button disabled>Недоступно</Button>
                <Button size="large">Запустить</Button>
                <IconButton aria-label="Удалить">
                    <Trash2 size={18} />
                </IconButton>
            </HStack>
            <HStack gap={24} wrap>
                <Link href="#normal">Обычная ссылка</Link>
                <Link href="#quiet" variant="quiet">
                    Тихая ссылка
                </Link>
                <Link href="#danger" variant="danger">
                    Удалить
                </Link>
                <Link href="#current" aria-current="page">
                    Текущий раздел
                </Link>
            </HStack>
            <HStack gap={24} wrap align="start" className={styles.fields}>
                <Field label="Номер заказа" description="Значение из строки таблицы">
                    <Input defaultValue="З-1042" />
                </Field>
                <Field label="Название" error="Укажите название">
                    <Input defaultValue="" />
                </Field>
                <Field label="Недоступное поле">
                    <Input disabled defaultValue="З-1042" />
                </Field>
                <Field label="Комментарий">
                    <Textarea placeholder="Причина изменения" />
                </Field>
                <Field label="Таблица">
                    <Select defaultValue="stock">
                        <option value="stock">Склад</option>
                        <option value="sales">Продажи</option>
                    </Select>
                </Field>
                <Field label="Количество" description="От 1 до 14">
                    <NumberField defaultValue={2} min={1} max={14} />
                </Field>
                <Field label="Канал">
                    <Choice options={options} defaultValue="shop" fullWidth />
                </Field>
                <Field label="Отправить уведомление">
                    <Checkbox defaultChecked />
                </Field>
                <Field label="Основной вариант">
                    <Radio name="gallery-radio" defaultChecked />
                </Field>
            </HStack>
            <HStack gap={16} wrap>
                <Stamp>Выполнено</Stamp>
                <Stamp variant="draft">Черновик</Stamp>
                <Stamp variant="void">Отменено</Stamp>
                <Marker>+1 строка</Marker>
                <ValueDiff before={14} after={12} />
                <Menu trigger="Действия" items={menuItems} />
            </HStack>
            <HStack gap={24} wrap>
                <Sheet>
                    <Text>Лист</Text>
                </Sheet>
                <Sheet variant="raised" border="dashed">
                    <Text>Предпросмотр</Text>
                </Sheet>
                <Sheet variant="well" border="ink">
                    <Text>Загрузка</Text>
                </Sheet>
            </HStack>
            <Divider />
            <Notice>
                <VStack gap={4}>
                    <Text variant="label" tone="danger">
                        Нельзя выполнить
                    </Text>
                    <Text>На складе недостаточно товара</Text>
                </VStack>
                <Link as="button" type="button">
                    Изменить количество
                </Link>
            </Notice>
        </VStack>
    );
}
