import type { DashboardItem } from '@/core/entities/dashboardItem';
import {
    Button,
    Field,
    HStack,
    Input,
    Text,
    VStack,
} from '@qualification-work/design-system';
import {
    dashboardChartMinHeight,
    dashboardChartMinWidth,
    dashboardGridColumns,
    dashboardMetricMinHeight,
    dashboardMetricMinWidth,
} from '@qualification-work/types';
import { useState } from 'react';

import type { DashboardItemLayoutInput } from '@/app/ports/repos/dashboard';

import { Modal } from '@/shared/ui';

type DashboardLayoutEditorProps = {
    items: DashboardItem[];
    onSave: (layout: DashboardItemLayoutInput[]) => void;
    onClose: () => void;
};

export function DashboardLayoutEditor({
    items,
    onSave,
    onClose,
}: DashboardLayoutEditorProps) {
    const [layout, setLayout] = useState(() =>
        items.map(item => ({ itemId: item.id, ...item.layout }))
    );

    return (
        <Modal title="Расположение виджетов" onClose={onClose} size="md" padding="md">
            <VStack
                as="form"
                gap={20}
                onSubmit={event => {
                    event.preventDefault();
                    onSave(layout);
                    onClose();
                }}
            >
                <Text variant="body-sm">
                    Координаты и размеры задаются в ячейках сетки из 12 колонок. Виджеты
                    не должны пересекаться.
                </Text>
                {layout.map((entry, index) => (
                    <VStack key={entry.itemId} gap={8}>
                        <Text variant="label">Виджет {index + 1}</Text>
                        <HStack gap={12} wrap>
                            {(['posX', 'posY', 'width', 'height'] as const).map(
                                (key, field) => (
                                    <Field
                                        key={key}
                                        label={
                                            ['Колонка', 'Строка', 'Ширина', 'Высота'][
                                                field
                                            ]
                                        }
                                    >
                                        <Input
                                            type="number"
                                            required
                                            step={1}
                                            min={
                                                key === 'posX' || key === 'posY'
                                                    ? 0
                                                    : key === 'width'
                                                      ? items[index]?.kind === 'metric'
                                                          ? dashboardMetricMinWidth
                                                          : dashboardChartMinWidth
                                                      : items[index]?.kind === 'metric'
                                                        ? dashboardMetricMinHeight
                                                        : dashboardChartMinHeight
                                            }
                                            max={
                                                key === 'posX'
                                                    ? dashboardGridColumns - entry.width
                                                    : key === 'width'
                                                      ? dashboardGridColumns - entry.posX
                                                      : undefined
                                            }
                                            value={entry[key]}
                                            onChange={event =>
                                                setLayout(current =>
                                                    current.map(row =>
                                                        row.itemId === entry.itemId
                                                            ? {
                                                                  ...row,
                                                                  [key]: Number(
                                                                      event.target.value
                                                                  ),
                                                              }
                                                            : row
                                                    )
                                                )
                                            }
                                        />
                                    </Field>
                                )
                            )}
                        </HStack>
                    </VStack>
                ))}
                <Button type="submit">Сохранить расположение</Button>
            </VStack>
        </Modal>
    );
}
