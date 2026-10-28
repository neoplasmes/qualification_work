import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import {
    Field,
    Input,
    NumberField,
    Choice,
    Textarea,
    Select,
    Checkbox,
    Radio,
} from '@qualification-work/design-system';

describe('field associations', () => {
    it('preserves explicit control ids and merges required descriptions', () => {
        const controlProps = {
            id: 'control',
            'aria-describedby': 'external',
            'aria-invalid': false as const,
        };
        const controls = [
            createElement(Input, controlProps),
            createElement(Textarea, controlProps),
            createElement(Select, controlProps),
            createElement(Checkbox, controlProps),
            createElement(Radio, controlProps),
        ];

        for (const control of controls) {
            const html = renderToStaticMarkup(
                createElement(Field, {
                    id: 'field',
                    label: 'Order',
                    description: 'Help',
                    error: 'Required',
                    children: control,
                })
            );

            expect(html).toContain('for="control"');
            expect(html).toMatch(/<(?:input|textarea|select)[^>]*id="control"/);
            expect(html).toContain(
                'aria-describedby="control-description control-error external"'
            );
            expect(html).toContain('aria-invalid="true"');
        }
    });

    it('uses an explicit child id before a generated field id', () => {
        const html = renderToStaticMarkup(
            createElement(Field, {
                label: 'Order',
                children: createElement(Input, { id: 'order' }),
            })
        );

        expect(html).toContain('for="order"');
        expect(html).toMatch(/<input[^>]*id="order"/);
    });

    it('preserves composite input ids descriptions and errors on first render', () => {
        const number = renderToStaticMarkup(
            createElement(Field, {
                id: 'field',
                label: 'Quantity',
                description: 'Help',
                error: 'Required',
                children: createElement(NumberField, {
                    defaultValue: 2,
                    'aria-describedby': 'outer',
                    inputProps: {
                        id: 'editable',
                        'aria-describedby': 'inner',
                        'aria-invalid': false,
                    },
                }),
            })
        );
        const choice = renderToStaticMarkup(
            createElement(Field, {
                label: 'Channel',
                description: 'Help',
                error: 'Required',
                children: createElement(Choice, {
                    id: 'channel',
                    options: [{ value: 'shop', label: 'Shop' }],
                    defaultValue: 'shop',
                    'aria-describedby': 'external',
                    'aria-invalid': false,
                }),
            })
        );

        expect(number).toContain('for="editable"');
        const editableInput = number.match(/<input[^>]*id="editable"[^>]*>/)?.[0];
        expect(editableInput).toContain(
            'aria-describedby="editable-description editable-error outer inner"'
        );
        expect(editableInput).toContain('aria-invalid="true"');
        expect(choice).toContain('aria-labelledby="channel-label"');
        expect(choice).toContain(
            'aria-describedby="channel-description channel-error external"'
        );
        expect(choice).toContain('aria-invalid="true"');
    });

    it('connects label help and error to the native control', () => {
        const html = renderToStaticMarkup(
            createElement(Field, {
                id: 'order',
                label: 'Order',
                description: 'Help',
                error: 'Required',
                children: createElement(Input),
            })
        );

        expect(html).toContain('for="order"');
        expect(html).toContain('id="order"');
        expect(html).toContain('aria-describedby="order-description order-error"');
        expect(html).toContain('aria-invalid="true"');
    });

    it('names the editable number input outside a field', () => {
        const html = renderToStaticMarkup(
            createElement(NumberField, {
                'aria-label': 'Quantity',
                defaultValue: 2,
            })
        );

        expect(html).toMatch(/<input[^>]*aria-label="Quantity"/);
    });

    it('names composite controls from the field label', () => {
        const number = renderToStaticMarkup(
            createElement(Field, {
                id: 'quantity',
                label: 'Quantity',
                children: createElement(NumberField, { defaultValue: 2 }),
            })
        );
        const choice = renderToStaticMarkup(
            createElement(Field, {
                id: 'channel',
                label: 'Channel',
                children: createElement(Choice, {
                    options: [{ value: 'shop', label: 'Shop' }],
                    defaultValue: 'shop',
                }),
            })
        );

        expect(number).toMatch(/<input[^>]*id="quantity"/);
        expect(choice).toContain('aria-labelledby="channel-label"');
    });
});
